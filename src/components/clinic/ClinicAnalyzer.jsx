import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, ArrowRight, Activity, Target, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ClinicAnalyzer({ onComplete }) {
    const [step, setStep] = useState(1);
    const [answers, setAnswers] = useState({
        focusAreas: [],
        goal: "",
        investment: ""
    });

    const focusOptions = [
        "Injektioner",
        "Hudvård & Ansiktsbehandlingar",
        "Permanent Hårborttagning",
        "Kroppsformning",
        "Avancerad Hudföryngring",
        "Skinbooster & Biostimulering"
    ];

    const handleFocusChange = (area, checked) => {
        setAnswers(prev => ({
            ...prev,
            focusAreas: checked 
                ? [...prev.focusAreas, area]
                : prev.focusAreas.filter(a => a !== area)
        }));
    };

    const nextStep = () => setStep(s => s + 1);

    const handleComplete = () => {
        onComplete(answers);
    };

    return (
        <div className="max-w-3xl mx-auto mt-8 w-full">
            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <Card className="border-emerald-100 shadow-lg">
                            <CardHeader className="text-center pb-2">
                                <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-2xl">Vilka är era primära fokusområden?</CardTitle>
                                <CardDescription>Välj de områden där ni har flest kunder idag eller vill växa inom.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-6">
                                {focusOptions.map(option => (
                                    <div key={option} className="flex items-center space-x-3 bg-slate-50 p-4 rounded-xl hover:bg-slate-100 transition-colors border border-slate-100">
                                        <Checkbox 
                                            id={option} 
                                            checked={answers.focusAreas.includes(option)}
                                            onCheckedChange={(c) => handleFocusChange(option, c)}
                                            className="w-5 h-5"
                                        />
                                        <Label htmlFor={option} className="flex-1 cursor-pointer text-base">{option}</Label>
                                    </div>
                                ))}
                            </CardContent>
                            <CardFooter className="flex justify-end pt-4">
                                <Button onClick={nextStep} disabled={answers.focusAreas.length === 0} className="bg-emerald-600 hover:bg-emerald-700 h-12 px-6 text-lg">
                                    Nästa fråga <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <Card className="border-emerald-100 shadow-lg">
                            <CardHeader className="text-center pb-2">
                                <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                                    <Target className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-2xl">Vad är ert främsta mål för nästa år?</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <RadioGroup value={answers.goal} onValueChange={v => setAnswers(prev => ({...prev, goal: v}))} className="space-y-3">
                                    {[
                                        "Öka omsättningen med befintliga kunder",
                                        "Attrahera en helt ny kundgrupp",
                                        "Bredda behandlingsutbudet med nya tjänster",
                                        "Höja kvaliteten och resultaten på befintliga behandlingar"
                                    ].map(goal => (
                                        <div key={goal} className="flex items-center space-x-3 bg-slate-50 p-4 rounded-xl hover:bg-slate-100 transition-colors border border-slate-100">
                                            <RadioGroupItem value={goal} id={goal} className="w-5 h-5" />
                                            <Label htmlFor={goal} className="flex-1 cursor-pointer text-base">{goal}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </CardContent>
                            <CardFooter className="flex justify-between pt-4">
                                <Button variant="ghost" onClick={() => setStep(1)} className="h-12">Tillbaka</Button>
                                <Button onClick={nextStep} disabled={!answers.goal} className="bg-emerald-600 hover:bg-emerald-700 h-12 px-6 text-lg">
                                    Nästa fråga <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <Card className="border-emerald-100 shadow-lg relative overflow-hidden">
                            <Sparkles className="absolute -right-4 -top-4 w-24 h-24 text-emerald-50 opacity-50 pointer-events-none" />
                            <CardHeader className="text-center pb-2 relative z-10">
                                <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-2xl">Vilken typ av investering är ni mest intresserade av just nu?</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 relative z-10">
                                <RadioGroup value={answers.investment} onValueChange={v => setAnswers(prev => ({...prev, investment: v}))} className="space-y-3">
                                    {[
                                        "Ny utrustning / Maskiner",
                                        "Utbildning och kompetensutveckling",
                                        "Färdiga kombinationspaket (Utrustning + Utbildning)",
                                        "Produkter och förbrukningsmaterial"
                                    ].map(inv => (
                                        <div key={inv} className="flex items-center space-x-3 bg-slate-50 p-4 rounded-xl hover:bg-slate-100 transition-colors border border-slate-100">
                                            <RadioGroupItem value={inv} id={inv} className="w-5 h-5" />
                                            <Label htmlFor={inv} className="flex-1 cursor-pointer text-base">{inv}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </CardContent>
                            <CardFooter className="flex justify-between pt-4 relative z-10">
                                <Button variant="ghost" onClick={() => setStep(2)} className="h-12">Tillbaka</Button>
                                <Button onClick={handleComplete} disabled={!answers.investment} className="bg-emerald-600 hover:bg-emerald-700 h-12 px-6 text-lg shadow-md hover:shadow-lg transition-all">
                                    Generera utvecklingsplan <Sparkles className="w-5 h-5 ml-2" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}