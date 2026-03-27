import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, User, CheckCircle, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function ChatSupport() {
    const [conversations, setConversations] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [user, setUser] = useState(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        base44.auth.me().then(setUser);
        loadConversations();
        
        const unsubConv = base44.entities.ChatConversation.subscribe(() => {
            loadConversations();
        });
        
        return () => unsubConv();
    }, []);

    useEffect(() => {
        if (!selectedConv) {
            setMessages([]);
            return;
        }

        base44.entities.ChatMessage.filter({ conversation_id: selectedConv.id }).then(msgs => {
            setMessages(msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
        });

        const unsubMsg = base44.entities.ChatMessage.subscribe((event) => {
            if (event.data.conversation_id === selectedConv.id && event.type === 'create') {
                setMessages(prev => [...prev, event.data]);
            }
        });

        return () => unsubMsg();
    }, [selectedConv?.id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const loadConversations = async () => {
        const convs = await base44.entities.ChatConversation.filter({
            status: { $in: ['open', 'in_progress', 'ai_active'] }
        }, '-last_message_at');
        setConversations(convs);
        
        // Update selected if it was changed
        setSelectedConv(prev => prev ? convs.find(c => c.id === prev.id) || null : null);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || !selectedConv || !user) return;
        
        const content = input;
        setInput("");
        
        // Take ownership if not already
        if (selectedConv.status !== 'in_progress' || selectedConv.assigned_to !== user.email) {
            await base44.entities.ChatConversation.update(selectedConv.id, {
                status: 'in_progress',
                assigned_to: user.email,
                assigned_to_name: user.full_name,
                last_message_at: new Date().toISOString()
            });
        }

        await base44.entities.ChatMessage.create({
            conversation_id: selectedConv.id,
            sender_type: 'agent',
            sender_name: user.full_name || 'Support',
            content: content
        });
    };

    const handleClose = async () => {
        if (!selectedConv) return;
        await base44.entities.ChatConversation.update(selectedConv.id, {
            status: 'closed'
        });
        setSelectedConv(null);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Chattsupport</h1>
                <p className="text-slate-500">Hantera inkommande chattar från serviceformuläret.</p>
            </div>
            
            <div className="flex gap-6 flex-1 min-h-0">
                {/* Conversations List */}
                <Card className="w-1/3 flex flex-col">
                    <CardHeader className="py-4 border-b">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" /> Aktiva Chattar
                        </CardTitle>
                    </CardHeader>
                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-2">
                            {conversations.length === 0 ? (
                                <div className="text-center text-slate-500 p-4 text-sm">Inga aktiva chattar.</div>
                            ) : (
                                conversations.map(conv => (
                                    <button
                                        key={conv.id}
                                        onClick={() => setSelectedConv(conv)}
                                        className={cn(
                                            "w-full text-left p-3 rounded-lg transition-colors border",
                                            selectedConv?.id === conv.id 
                                                ? "bg-primary/5 border-primary/20" 
                                                : "bg-white hover:bg-slate-50 border-transparent hover:border-slate-200"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium text-sm flex items-center gap-2">
                                                {conv.customer_name ? (
                                                    <><Building2 className="w-4 h-4 text-indigo-500" /> {conv.customer_name}</>
                                                ) : (
                                                    <><User className="w-4 h-4 text-slate-400" /> Gäst</>
                                                )}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {conv.last_message_at ? format(new Date(conv.last_message_at), "HH:mm") : ""}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs mt-2">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full",
                                                conv.status === 'open' ? "bg-amber-100 text-amber-800" :
                                                conv.status === 'ai_active' ? "bg-purple-100 text-purple-800" :
                                                "bg-blue-100 text-blue-800"
                                            )}>
                                                {conv.status === 'open' ? 'Väntar' : conv.status === 'ai_active' ? 'AI Svarar' : 'Pågår'}
                                            </span>
                                            {conv.assigned_to_name && (
                                                <span className="text-slate-500 truncate">
                                                    Hanteras av {conv.assigned_to_name}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </Card>

                {/* Chat Area */}
                <Card className="flex-1 flex flex-col">
                    {selectedConv ? (
                        <>
                            <CardHeader className="py-3 border-b flex flex-row items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                                        {selectedConv.customer_name ? <Building2 className="w-5 h-5 text-indigo-500" /> : <User className="w-5 h-5 text-slate-500" />}
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">{selectedConv.customer_name || "Gäst"}</CardTitle>
                                        <p className="text-xs text-slate-500">
                                            {selectedConv.guest_email ? selectedConv.guest_email : `ID: ${selectedConv.guest_id.substring(0, 8)}...`}
                                        </p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={handleClose} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                    <CheckCircle className="w-4 h-4 mr-2" /> Avsluta chatt
                                </Button>
                            </CardHeader>
                            <ScrollArea className="flex-1 p-4 bg-slate-50">
                                <div className="space-y-4">
                                    {messages.map(msg => {
                                        const isAgent = msg.sender_type === 'agent' || msg.sender_type === 'ai';
                                        return (
                                            <div key={msg.id} className={cn("flex flex-col max-w-[70%]", isAgent ? "ml-auto items-end" : "mr-auto items-start")}>
                                                <span className="text-[10px] text-slate-400 mb-1 px-1">
                                                    {msg.sender_name} • {format(new Date(msg.created_date), "HH:mm")}
                                                </span>
                                                <div className={cn(
                                                    "p-3 rounded-2xl text-sm",
                                                    isAgent 
                                                        ? msg.sender_type === 'ai' ? "bg-purple-100 text-purple-900 rounded-tr-sm" : "bg-primary text-primary-foreground rounded-tr-sm" 
                                                        : "bg-white border text-slate-800 rounded-tl-sm"
                                                )}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={scrollRef} />
                                </div>
                            </ScrollArea>
                            <div className="p-4 bg-white border-t">
                                <form onSubmit={handleSend} className="flex gap-3">
                                    <Input 
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        placeholder="Skriv ditt svar här..."
                                        className="flex-1"
                                    />
                                    <Button type="submit" disabled={!input.trim()}>
                                        <Send className="w-4 h-4 mr-2" /> Skicka
                                    </Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                            <p>Välj en chatt i listan för att svara</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}