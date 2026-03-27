import React, { useState, useEffect, useRef } from 'react';
import { base44 } from "@/api/base44Client";
import { MessageCircle, X, Send, Loader2, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import PrivacyPolicyContent from "@/components/PrivacyPolicyContent";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [email, setEmail] = useState("");
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [guestId, setGuestId] = useState("");
    const scrollRef = useRef(null);

    // Initialize Guest ID
    useEffect(() => {
        let storedId;
        try {
            storedId = localStorage.getItem('astomed_chat_guest_id');
            if (!storedId) {
                storedId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
                localStorage.setItem('astomed_chat_guest_id', storedId);
            }
        } catch (e) {
            console.warn("localStorage ej tillgängligt, använder tillfälligt ID", e);
            storedId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
        }
        setGuestId(storedId);
    }, []);

    // Load active conversation
    useEffect(() => {
        if (isOpen && guestId) {
            loadConversation();
        }
    }, [isOpen, guestId]);

    // Subscribe to messages
    useEffect(() => {
        if (!conversation?.id) return;

        // Load existing messages
        base44.entities.ChatMessage.filter({ conversation_id: conversation.id }).then(msgs => {
            // Sort by created_date
            const sorted = msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
            setMessages(sorted);
        });

        // Subscribe to new messages
        const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
            if (event.data.conversation_id === conversation.id) {
                if (event.type === 'create') {
                    setMessages(prev => [...prev, event.data]);
                }
            }
        });

        return () => unsubscribe();
    }, [conversation?.id]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const loadConversation = async () => {
        setIsLoading(true);
        try {
            // Find active conversation for this guest
            const convs = await base44.entities.ChatConversation.filter({ 
                guest_id: guestId,
                status: { $in: ['open', 'in_progress', 'ai_active'] }
            });

            if (convs.length > 0) {
                setConversation(convs[0]);
            } else {
                // We'll create one when they send the first message
                setConversation(null); 
            }
        } catch (error) {
            console.error("Failed to load conversation", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartChat = async (e) => {
        e.preventDefault();
        if (!email.trim() || !privacyAccepted) return;
        
        setIsStarting(true);
        try {
            const response = await base44.functions.invoke('startChatConversation', {
                email: email.trim(),
                guestId: guestId
            });
            setConversation(response.data.conversation);
            
            // Log interaction if needed, or just let them start sending messages
        } catch (error) {
            console.error("Failed to start conversation", error);
        } finally {
            setIsStarting(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || !conversation) return;
        
        const content = input;
        setInput(""); // Clear input immediately

        try {
            let currentConv = conversation;

            // Update timestamp
            await base44.entities.ChatConversation.update(currentConv.id, {
                last_message_at: new Date().toISOString()
            });

            // Create message
            await base44.entities.ChatMessage.create({
                conversation_id: currentConv.id,
                sender_type: 'guest',
                sender_name: 'Gäst',
                content: content
            });

        } catch (error) {
            console.error("Failed to send message", error);
            // Optionally restore input on failure
            setInput(content);
        }
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[60] flex flex-col items-end gap-2 group hover:scale-105 transition-transform"
            >
                <div className="bg-white text-[#1b3a3a] px-4 py-2 rounded-xl shadow-lg border border-[#1b3a3a]/10 mb-1 hidden md:block">
                    <span className="text-sm font-semibold">Chatta med en servicetekniker</span>
                </div>
                <div className="h-14 w-14 md:h-16 md:w-16 rounded-full shadow-xl overflow-hidden border-2 border-white ring-2 ring-[#1b3a3a]/10">
                    <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a9446fcb1cd4ab529479ba/bc2852de1_channels4_profile-2.jpg" 
                        alt="Chat" 
                        className="w-full h-full object-cover"
                    />
                </div>
            </button>
        );
    }

    return (
        <Card className="fixed bottom-4 right-4 md:bottom-6 md:right-6 w-[calc(100vw-32px)] md:w-[350px] h-[500px] max-h-[calc(100vh-120px)] shadow-2xl z-[60] flex flex-col border-primary/20">
            <CardHeader className="bg-[#1b3a3a] text-white p-4 rounded-t-xl flex flex-row items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-white/10 overflow-hidden border border-white/20">
                         <img 
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a9446fcb1cd4ab529479ba/bc2852de1_channels4_profile-2.jpg" 
                            alt="Astomed" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <CardTitle className="text-base">Astomed Support</CardTitle>
                        <p className="text-xs text-white/80">Vi hjälper dig med dina frågor</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20">
                    <X className="h-5 w-5" />
                </Button>
            </CardHeader>
            
            <CardContent className="flex-1 p-0 flex flex-col overflow-hidden bg-white">
                {!conversation && !isLoading ? (
                    <div className="p-6 flex flex-col h-full overflow-y-auto">
                        <div className="text-center mb-6">
                            <h3 className="text-lg font-semibold text-[#1b3a3a] mb-2">Välkommen till chatten!</h3>
                            <p className="text-sm text-slate-500">För att vi ska kunna ge dig bästa möjliga service behöver vi din e-postadress ifall vi skulle tappa anslutningen.</p>
                        </div>
                        <form onSubmit={handleStartChat} className="space-y-5 flex-1 flex flex-col">
                            <div className="space-y-2">
                                <Label htmlFor="chat-email">E-postadress</Label>
                                <Input 
                                    id="chat-email"
                                    type="email" 
                                    placeholder="din.epost@exempel.se" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mt-auto">
                                <label className="flex items-start gap-3 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={privacyAccepted}
                                        onChange={(e) => setPrivacyAccepted(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 accent-[#3a9e9e] flex-shrink-0"
                                        required
                                    />
                                    <span className="text-xs text-slate-700">
                                        Jag godkänner{" "}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setShowPrivacyDialog(true);
                                            }}
                                            className="text-[#3a9e9e] hover:underline font-medium"
                                        >
                                            integritetspolicyn
                                        </button>
                                        .
                                    </span>
                                </label>
                            </div>
                            
                            <Button 
                                type="submit" 
                                className="w-full bg-[#1b3a3a] hover:bg-[#254f4f]" 
                                disabled={!email.trim() || !privacyAccepted || isStarting}
                            >
                                {isStarting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Starta chatt"}
                            </Button>
                        </form>
                    </div>
                ) : (
                <>
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.length === 0 && !isLoading && (
                            <div className="text-center text-sm text-slate-500 mt-8">
                                <p>Välkommen!</p>
                                <p>Skriv din fråga här så svarar vi så fort vi kan.</p>
                                <p className="text-xs mt-2 text-slate-400">Öppet 08:30-16:30</p>
                            </div>
                        )}
                        
                        {messages.map((msg) => {
                            const isGuest = msg.sender_type === 'guest';
                            return (
                                <div key={msg.id} className={cn("flex gap-2 max-w-[85%]", isGuest ? "ml-auto" : "mr-auto")}>
                                    {!isGuest && (
                                        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-1">
                                            {msg.sender_type === 'ai' ? <Bot className="h-3 w-3 text-primary" /> : <User className="h-3 w-3 text-primary" />}
                                        </div>
                                    )}
                                    <div className={cn(
                                        "p-3 rounded-lg text-sm",
                                        isGuest ? "bg-primary text-primary-foreground rounded-br-none" : "bg-slate-100 text-slate-800 rounded-bl-none"
                                    )}>
                                        {msg.content}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                <div className="p-3 bg-slate-50 border-t mt-auto">
                    <form 
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex gap-2"
                    >
                        <Input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Skriv ett meddelande..."
                            className="bg-white"
                        />
                        <Button type="submit" size="icon" disabled={!input.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
                </>
                )}
            </CardContent>
            
            <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
                    <PrivacyPolicyContent />
                    <div className="p-6 border-t border-slate-100 flex-shrink-0">
                        <Button
                            className="w-full bg-[#1b3a3a] hover:bg-[#254f4f] text-white"
                            onClick={() => setShowPrivacyDialog(false)}
                        >
                            Stäng
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}