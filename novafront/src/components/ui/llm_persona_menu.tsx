import { Panda, Dumbbell, Sparkles, Flame, Brain } from "lucide-react";
import React from "react";
import { useTheme } from "../../context/ThemeContext";

export const LLMPersonaMenu = () => {

    const { currentTheme } = useTheme();

    const [selectedPersona, setSelectedPersona] = React.useState<string | null>('General');

    const handlePersonaClick = (persona: string) => {
        setSelectedPersona(persona);
    }

    return (
        <div className="flex flex-col space-y-2 bg-background mr-5 ml-5 w-fit h-full max-w-[10vw] max-h-[96vh] p-2 rounded-2xl border border-border py-3 px-3 ">

            <div className="flex items-center space-x-2 p-2 flexdirection-row text-text text-md gap-2">
                <Sparkles size={28} strokeWidth={1.7} className= "text-primary" />
            </div>

            {/* Divider */}
            <div className="border-b border-text my-2" />

            {/* Persona Options */}
            <div className="flex items-center space-x-2 p-2 hover:bg-primary rounded cursor-pointer"
                onClick={() => handlePersonaClick('General')}
                style={{ borderColor: selectedPersona === 'General' ? currentTheme.colors.primary : 'none' , borderWidth: selectedPersona === 'General' ? 1.7 : 0}}
            >
                <Brain size={28} strokeWidth={1.7} className="text-text" />
            </div>

            <div className="flex items-center space-x-2 p-2 hover:bg-primary rounded cursor-pointer"
                onClick={() => handlePersonaClick('Creative')}
                style={{ borderColor: selectedPersona === 'Creative' ? currentTheme.colors.primary : 'none' , borderWidth: selectedPersona === 'Creative' ? 1.7 : 0}}
            >
                <Flame size={28} strokeWidth={1.7} className="text-text" />
            </div>

            <div className="flex items-center space-x-2 p-2 hover:bg-primary rounded cursor-pointer"
                onClick={() => handlePersonaClick('Friendly')}
                style={{ borderColor: selectedPersona === 'Friendly' ? currentTheme.colors.primary : 'none' , borderWidth: selectedPersona === 'Friendly' ? 1.7 : 0}}
            >
                <Panda size={28} strokeWidth={1.7} className="text-text"  />
            </div>

            <div className="flex items-center space-x-2 p-2 hover:bg-primary rounded cursor-pointer"
                onClick={() => handlePersonaClick('Technical')}
                style={{ borderColor: selectedPersona === 'Technical' ? currentTheme.colors.primary : 'none' , borderWidth: selectedPersona === 'Technical' ? 1.7 : 0}}
            >
                <Dumbbell size={28} strokeWidth={1.7} className="text-text" />
            </div>

        </div>
    );
};