
import { useState } from "react";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { formatText } from "@/utils/conversation-utils";

export const DashboardManual = () => {
  const [expandedValue, setExpandedValue] = useState<string | undefined>(undefined);
  
  const handleValueChange = (value: string) => {
    setExpandedValue(value.length > 0 ? value : undefined);
  };
  
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <h3 className="text-xl font-semibold mb-4 font-montserrat text-primary">Dashbord Manual</h3>
        <Accordion 
          type="single" 
          collapsible 
          value={expandedValue} 
          onValueChange={handleValueChange}
          className="space-y-2"
        >
          <AccordionItem value="home">
            <AccordionTrigger className="text-base font-medium">Hjem-fanen</AccordionTrigger>
            <AccordionContent>
              <div 
                className="prose prose-sm max-w-none" 
                dangerouslySetInnerHTML={{ 
                  __html: formatText(`Hjem-fanen gir deg en oversikt over viktig informasjon om systemet ditt:

* **Serverstatus** - Viser om chatbot-tjenesten fungerer som den skal
* **Ubesvarte spørsmål** - Spørsmål som chatboten ikke kunne svare på
* **Feilrapportering** - Her kan du rapportere feil du oppdager i chatboten`)
                }} 
              />
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="conversations">
            <AccordionTrigger className="text-base font-medium">Samtaler-fanen</AccordionTrigger>
            <AccordionContent>
              <div 
                className="prose prose-sm max-w-none" 
                dangerouslySetInnerHTML={{ 
                  __html: formatText(`I Samtaler-fanen kan du gjennomgå alle samtaler mellom brukere og chatboten:

* **Søk** - Søk etter nøkkelord i samtaler (merk: du kan bare søke i innhold for samtaler som er lastet inn)
* **Filtre** - Filtrer etter lagrede eller godkjente samtaler
* **Lagre samtaler** - Klikk på bokmerke-ikonet for å lagre viktige samtaler
* **Godkjenne samtaler** - Klikk på hake-ikonet for å markere samtaler som godkjent
* **Q&A-par** - Velg to meldinger (ett spørsmål og ett svar) for å opprette et Q&A-par som kan legges til i kunnskapsbasen
* **Slette samtaler** - Bruk søppelkasse-ikonet for å slette samtaler`)
                }} 
              />
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="knowledge">
            <AccordionTrigger className="text-base font-medium">Kunnskapsbase-fanen</AccordionTrigger>
            <AccordionContent>
              <div 
                className="prose prose-sm max-w-none" 
                dangerouslySetInnerHTML={{ 
                  __html: formatText(`Kunnskapsbase-fanen lar deg administrere informasjonen som chatboten bruker:

* **Kilder** - Se alle kunnskapskilder chatboten har tilgang til
* **Kildetyper** - Filtrer etter kildetyper (URL, tekst, fil, Q&A)
* **Legg til ny kilde** - Last opp filer, legg til lenker eller skriv inn informasjon manuelt
* **Redigere kilder** - Oppdater eksisterende informasjon
* **Fjerne kilder** - Fjern kilder som ikke lenger er relevante`)
                }} 
              />
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="statistics">
            <AccordionTrigger className="text-base font-medium">Statistikk-fanen</AccordionTrigger>
            <AccordionContent>
              <div 
                className="prose prose-sm max-w-none" 
                dangerouslySetInnerHTML={{ 
                  __html: formatText(`Statistikk-fanen gir deg innsikt i hvordan chatboten blir brukt:

* **Samtalestatistikk** - Se hvor mange samtaler som er gjennomført over tid
* **Vanlige spørsmål** - Se hvilke temaer brukerne oftest spør om
* **Responstid** - Gjennomsnittlig tid for chatboten å svare
* **Brukeraktivitet** - Se når på dagen/uken chatboten brukes mest
* **Besparelser** - Estimat av hvor mye tid og ressurser chatboten sparer`)
                }} 
              />
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="administrator">
            <AccordionTrigger className="text-base font-medium">Administrator-fanen</AccordionTrigger>
            <AccordionContent>
              <div 
                className="prose prose-sm max-w-none" 
                dangerouslySetInnerHTML={{ 
                  __html: formatText(`Administrator-fanen lar deg administrere brukere og tilganger:

* **Legg til medlem** - Fyll ut skjemaet for å legge til en ny bruker
* **Administrere tilgang** - Velg hvilke faner hver bruker skal ha tilgang til
* **Tips** - Du må først legge til et medlem før du kan administrere tilgangen deres

**Merk:** Bare brukere med administratorrettigheter kan se og bruke denne fanen.`)
                }} 
              />
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="tips">
            <AccordionTrigger className="text-base font-medium">Nyttige tips</AccordionTrigger>
            <AccordionContent>
              <div 
                className="prose prose-sm max-w-none" 
                dangerouslySetInnerHTML={{ 
                  __html: formatText(`Noen nyttige tips for å få mest mulig ut av dashbordet:

* **Forhåndslasting** - Samtaler lastes automatisk inn i bakgrunnen for raskere visning
* **Søk i innhold** - Aktiver "Søk i innhold" for å søke i hele samtaler, ikke bare metadataene
* **Bokmerker** - Bruk bokmerker for å markere viktige samtaler for senere referanse
* **Feilrapportering** - Rapporter feil umiddelbart med så mye kontekst som mulig
* **Regelmessig gjennomgang** - Sjekk ubesvarte spørsmål regelmessig for å forbedre chatboten`)
                }} 
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};
