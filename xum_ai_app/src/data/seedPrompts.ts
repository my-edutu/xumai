/**
 * XUM AI - Seed Prompts Data
 * 
 * Generates initial mock prompts for the Data Engine.
 */

import { TaskPrompt } from '../services/types';

const MOCK_PROMPTS = {
    voice: [
        "Read aloud: 'The quick brown fox jumps over the lazy dog'",
        "Say the numbers 1 through 10 in your local dialect",
        "Describe your morning routine in exactly 15 seconds",
        "Explain the meaning of 'Ubusuku' to a foreigner",
        "Record yourself asking for directions to the nearest hospital",
        "Say: 'I have had a fever since yesterday morning'",
        "Pronounce the word 'Queue' three times slowly",
        "Tell a short joke about a chicken crossing the road",
        "Record the sound of your local market environment",
        "Say: 'Please call an ambulance, it is an emergency'",
        "Translate 'How much is a bag of rice?' into Pidgin",
        "Sing the first line of your favorite childhood song",
        "Describe the taste of your favorite local food",
        "Say 'Thank you very much' with extreme gratitude",
        "Roleplay ordering food at a busy local restaurant",
        "Explain how to tie a shoelace using only words",
        "Say: 'I need two packets of paracetamol'",
        "Describe the weather outside right now",
        "Read aloud: 'Artificial Intelligence is transforming the future'",
        "Say your favorite African proverb"
    ],
    image: [
        "Take a photo of a clear, cloudless sky",
        "Capture an image of a handwritten note",
        "Photograph a local street sign or billboard",
        "Take a close-up photo of a textured fabric",
        "Capture an image of a potted plant indoors",
        "Photograph a busy intersection (no faces visible)",
        "Take a picture of a traditional African meal",
        "Capture a photo of a pothole on a paved road",
        "Photograph a local market stall from a distance",
        "Take a picture of a 1000 Naira note (or local currency)",
        "Capture an image of a yellow commercial bus or taxi",
        "Photograph a piece of electronic e-waste",
        "Take a photo of a power transformer or electric pole",
        "Capture an image of a bicycle parked outdoors",
        "Photograph a water borehole or public well",
        "Take a close-up of a damaged smartphone screen",
        "Capture an image of a street food vendor's setup",
        "Photograph a modern office building exterior",
        "Take a picture of a traditional musical instrument",
        "Capture an image of recyclable plastic waste"
    ],
    video: [
        "Record a 10-second video of traffic flowing",
        "Film a slow pan across your workstation/desk",
        "Record a 5-second video of water pouring into a glass",
        "Film someone (or yourself) waving at the camera",
        "Record a 10-second video of a ceiling fan spinning",
        "Film a demonstration of inserting a key into a lock",
        "Record a 5-second video of pages turning in a book",
        "Film a 10-second zoom-in on a flower or plant",
        "Record yourself typing on a keyboard for 5 seconds",
        "Film a 10-second video walking down a hallway",
        "Record a 5-second loop of an analog clock ticking",
        "Film the process of opening and closing an umbrella",
        "Record a 10-second video of trees blowing in the wind",
        "Film a 5-second clip of coffee/tea being stirred",
        "Record a 10-second video of an escalator moving",
        "Film a demonstration of peeling a fruit",
        "Record a 5-second video of a bouncing ball",
        "Film a 10-second video of rain falling on a window",
        "Record yourself nodding in agreement for 5 seconds",
        "Film a 10-second video panning across a bookshelf"
    ],
    text: [
        "Write a 3-sentence summary of the movie 'The Matrix'",
        "List 5 common reasons people are late to work",
        "Translate 'I am very hungry' into three local dialects",
        "Write a short, polite email declining a job offer",
        "Explain the concept of 'Inflation' in simple terms",
        "List the ingredients needed to make Jollof Rice",
        "Write a haiku about the rainy season",
        "Describe the plot of your favorite book in one paragraph",
        "List 5 safety rules for riding a motorcycle",
        "Write a 2-sentence definition of 'Artificial Intelligence'",
        "Create a catchy slogan for a new sports drink",
        "Write a short dialogue between a customer and a tailor",
        "Explain how to reset a Wi-Fi router in 3 steps",
        "List 5 synonyms for the word 'Beautiful'",
        "Write a short review of the last phone you used",
        "Describe the feeling of walking barefoot on grass",
        "List 5 things you would pack for a beach holiday",
        "Write a 3-sentence biography of Nelson Mandela",
        "Explain the rules of football (soccer) to an alien",
        "Write a polite text message apologizing for missing a meeting"
    ]
};

export function getSeedPrompts(): Partial<TaskPrompt>[] {
    const prompts: Partial<TaskPrompt>[] = [];
    let idCounter = 1;

    // Helper to generate IDs
    const getId = () => `mock_seed_${idCounter++}`;

    // Add exactly 20 of each type
    (Object.keys(MOCK_PROMPTS) as Array<keyof typeof MOCK_PROMPTS>).forEach(type => {
        MOCK_PROMPTS[type].forEach(promptText => {
            prompts.push({
                id: getId(),
                task_type: type as any,
                prompt_text: promptText,
                category: 'Mock Data Cap',
                difficulty_level: Math.floor(Math.random() * 3) + 1, // Random 1-3
                base_reward: 0.15,
                bonus_reward: 0.05,
                hint_text: `Please verify quality before submitting. (${type.toUpperCase()})`
            });
        });
    });

    return prompts;
}
