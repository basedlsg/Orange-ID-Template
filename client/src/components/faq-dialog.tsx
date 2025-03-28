import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is the 2025 Orange Vibe Jam?",
    answer: "The 2025 Orange Vibe Jam is a competition hosted by @Orange_web3 and @vibecodinglist, inviting developers to create vibe-coded app and games. It offers up to $100K USD in prizes and is open to web-based projects that meet specific entry conditions."
  },
  {
    question: "What are the prizes for the 2025 Orange Vibe Jam?",
    answer: "The prize pool includes:\n\n1st Place: $25,000 USD ($20K USD and 1M ORNG tokens)\n\n2nd Place: $12,000 USD ($10K USD and 500K ORNG tokens)\n\n3rd Place: $6,500 USD ($5K USD and 250K ORNG tokens)\n\nAdditional prizes are available, with full details to be announced closer to the event."
  },
  {
    question: "Who can enter the competition?",
    answer: "Anyone can enter as long as their app or game meets the conditions of entry, which include being vibe-coded, web-based, integrating Orange ID, and having at least 80% of the code written by AI."
  },
  {
    question: "What are the conditions of entry?",
    answer: "To participate:\n\n• Your app or game must be vibe-coded.\n\n• At least 80% of the code must be AI-generated.\n\n• The project must be web-based.\n\n• Orange ID integration is required.\n\n• You must complete the attached registration form to enter."
  },
  {
    question: "How will entries be judged?",
    answer: "A judging panel, appointed by Orange Web3 and Vibecodinglist, will evaluate entries based on factors such as UI/UX, user reviews, and engagement. Full judging criteria and judging panel will be released before the competition begins."
  },
  {
    question: "When do entries open and close?",
    answer: "Entries close on April 7, 2025, at 8:00 PM UTC. Be sure to submit your registration form by this deadline."
  },
  {
    question: "When is the deadline for final app or game submissions?",
    answer: "Final submissions are due by April 19, 2025. Ensure your completed project is submitted by this date."
  },
  {
    question: "When will winners be announced?",
    answer: "Judging will conclude on April 30, 2025, and winners will be announced on the same day."
  },
  {
    question: "Can the key dates change?",
    answer: "Yes, all dates (entry close, submission deadline, and judging) are subject to change. Any updates will be communicated with notice to participants."
  },
  {
    question: "How do I register for the Orange Vibe Jam?",
    answer: "To register, complete the registration form attached to the announcement or available via the official website, vibecodinglist.com."
  },
  {
    question: "What is Orange ID, and how do I integrate it?",
    answer: "Orange ID is a required component for your app or game. Specific integration details will be provided through the official website at vibecodinglist.com."
  },
  {
    question: "Where can I find more information about the competition?",
    answer: "Visit the official website, vibecodinglist.com, for sponsorship details, FAQs, project information, and updates."
  },
  {
    question: "Who is organizing the 2025 Orange Vibe Jam?",
    answer: "The competition is a joint effort by @Orange_web3 and @vibecodinglist, two entities collaborating to promote innovative, AI-driven web development."
  },
  {
    question: "What happens if I already have a vibe coded app or game?",
    answer: "As long as you integrate the Orange ID, it doesn't matter when it was produced or released."
  },
  {
    question: "Can I submit both an app and a game?",
    answer: "You may enter one app or game per application form submitted."
  },
  {
    question: "Why integrate Orange ID?",
    answer: "Orange ID is a federated login system that connects 10s of thousands of users across games and applications. With a soon to launch rewards system and an ever growing network of users and creators the Orange ID helps you to avoid cold starts and incentivises users to visit and engage with your applications."
  }
];

export function FAQButton({ className = "" }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={`text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 border-2 border-orange-300 ${className}`}
      >
        Orange Vibe Jam FAQ
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl font-bold text-center">2025 Orange Vibe Jam - FAQs</DialogTitle>
            <DialogDescription className="text-center text-orange-500 pt-2">
              Everything you need to know about the Orange Vibe Jam hackathon
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 px-6 py-4 max-h-[70vh]">
            <div className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-b border-zinc-200 dark:border-zinc-800">
                    <AccordionTrigger className="text-left font-medium py-4">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="whitespace-pre-line text-sm text-muted-foreground pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </ScrollArea>
          <div className="p-6 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              onClick={() => setIsOpen(false)}
              className="w-full bg-orange-500 text-white hover:bg-orange-600"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}