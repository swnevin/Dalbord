
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Home, MessageSquare, LineChart, BookOpenCheck, Shield, Lightbulb } from "lucide-react";

export const DashboardManual = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-montserrat flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <span>Dashbord Manual</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion
          type="single"
          collapsible
          value={expandedSection || undefined}
          onValueChange={(value) => setExpandedSection(value)}
        >
          <AccordionItem value="introduction">
            <AccordionTrigger className="font-medium">
              Introduksjon
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-2">
              <p>
                Velkommen til DALAI Dashbordet! Denne manualen vil hjelpe deg med å forstå 
                de ulike funksjonene og verktøyene som er tilgjengelige for deg.
              </p>
              <p>
                DALAI-dashbordet er delt inn i fem hovedseksjoner: Hjem, Samtaler, Kunnskapsbase, 
                Statistikk og Administrator. Hver seksjon gir deg ulike verktøy for å overvåke 
                og forbedre din chatbot.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="home-tab">
            <AccordionTrigger className="font-medium">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span>Hjem</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-2">
              <p>
                <strong>Systemstatus:</strong> Viser den nåværende driftsstatus for alle systemer. 
                En grønn indikator betyr at alt fungerer som normalt.
              </p>
              <p>
                <strong>Henvendelser sendt til fallback:</strong> Viser spørsmål som chatboten 
                ikke kunne besvare og som ble videresendt til menneskelig hjelp. Du kan opprette 
                nye Q&A-oppføringer basert på disse henvendelsene for å forbedre botens kunnskaper.
              </p>
              <ul className="list-disc pl-5 mt-2">
                <li>Klikk på en uløst henvendelse for å opprette en ny Q&A-oppføring</li>
                <li>Bla mellom uløste og løste henvendelser med fanevalget</li>
                <li>Vis flere løste henvendelser med "Vis alle"-knappen</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="conversations-tab">
            <AccordionTrigger className="font-medium">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>Samtaler</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-2">
              <p>
                Samtaler-fanen gir deg tilgang til alle samtaler som brukere har hatt med chatboten din.
              </p>
              <p>
                <strong>Hovedfunksjoner:</strong>
              </p>
              <ul className="list-disc pl-5">
                <li>Se en liste over alle samtaler, sortert etter dato (nyeste først)</li>
                <li>Søk i samtaler etter innhold, navn eller dato</li>
                <li>Filtrer samtaler etter "Alle", "Lagret" eller "Godkjent" status</li>
                <li>Merk samtaler som lagret (stjerne-ikonet) eller godkjent (hake-ikonet)</li>
                <li>Slett samtaler som ikke er nødvendige lenger</li>
                <li>Se hele samtalens dialog ved å klikke på en samtale</li>
              </ul>
              <p className="mt-2">
                <strong>Tips:</strong> Bruk søkefunksjonen og filtre for å finne 
                spesifikke samtaler raskt. Forhåndslasting av samtaler skjer automatisk 
                for å gi en raskere brukeropplevelse.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="knowledge-base-tab">
            <AccordionTrigger className="font-medium">
              <div className="flex items-center gap-2">
                <BookOpenCheck className="h-4 w-4" />
                <span>Kunnskapsbase</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-2">
              <p>
                Kunnskapsbasen er hvor all informasjon som chatboten din bruker for å svare på spørsmål er lagret.
              </p>
              <p>
                <strong>Kildetype-filteret:</strong> Vis kun:
              </p>
              <ul className="list-disc pl-5">
                <li>Alle kilder</li>
                <li>Filer (PDF, DOCX, TXT)</li>
                <li>URLer (nettsider)</li>
                <li>Q&A (spørsmål og svar)</li>
              </ul>
              <p className="mt-2">
                <strong>Legge til nye kilder:</strong> Klikk på "Legg til kilde"-knappen og velg mellom:
              </p>
              <ul className="list-disc pl-5">
                <li>Last opp fil: Last opp PDF, DOCX eller TXT-filer</li>
                <li>Legg til URL: Legg til en nettside som kunnskapskilde</li>
                <li>Spørsmål & Svar: Lag direktegodkjente svar til spesifikke spørsmål</li>
                <li>Direktetekst: Skriv inn egendefinert tekstinformasjon</li>
              </ul>
              <p className="mt-2">
                <strong>Tips:</strong> Q&A-oppføringer er best for spesifikke spørsmål som 
                ofte stilles, mens filer og URL-er er ideelle for større informasjonsmengder.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="statistics-tab">
            <AccordionTrigger className="font-medium">
              <div className="flex items-center gap-2">
                <LineChart className="h-4 w-4" />
                <span>Statistikk</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-2">
              <p>
                Statistikk-fanen gir deg verdifull innsikt i hvordan chatboten din presterer.
              </p>
              <p>
                <strong>Nøkkeltall:</strong>
              </p>
              <ul className="list-disc pl-5">
                <li>Totalt antall samtaler</li>
                <li>Gjennomsnittlig tid spart</li>
                <li>Besparelser i timer</li>
                <li>Antall samtaler med menneskelig hjelp</li>
              </ul>
              <p className="mt-2">
                <strong>Grafer og data:</strong>
              </p>
              <ul className="list-disc pl-5">
                <li>Samtaleaktivitet over tid</li>
                <li>Fordeling av samtaletyper</li>
                <li>Tidssparingsanalyse</li>
              </ul>
              <p className="mt-2">
                <strong>Tips:</strong> Bruk statistikken til å identifisere 
                perioder med høy aktivitet eller områder hvor boten kan forbedres.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="administrator-tab">
            <AccordionTrigger className="font-medium">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Administrator</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-2">
              <p>
                Administrator-fanen gir tilgang til bruker- og organisasjonsadministrasjon.
              </p>
              <p>
                <strong>Administrer medlemmer:</strong>
              </p>
              <ul className="list-disc pl-5">
                <li>Legg til nye medlemmer i organisasjonen</li>
                <li>Konfigurer tilganger basert på faner (Hjem, Samtaler, osv.)</li>
                <li>Fjern medlemmer som ikke lenger trenger tilgang</li>
              </ul>
              <p className="mt-2">
                <strong>Sikkerhet:</strong> Administrator-fanen er kun synlig og 
                tilgjengelig for brukere som har fått Administrator-tilgang.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="pro-tips">
            <AccordionTrigger className="font-medium">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                <span>Pro Tips</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-2">
              <p>
                <strong>Forbedre chatboten kontinuerlig:</strong>
              </p>
              <ul className="list-disc pl-5">
                <li>Gå gjennom fallbackhenvendelser regelmessig og legg til Q&A-oppføringer</li>
                <li>Analyser samtaler for å identifisere manglende kunnskap</li>
                <li>Oppdater kunnskapsbasen med ny informasjon når den blir tilgjengelig</li>
                <li>Test chatboten jevnlig for å sikre at svarene er nøyaktige</li>
                <li>Bruk statistikk for å måle forbedringer over tid</li>
              </ul>
              <p className="mt-2">
                <strong>Tastaturkjorti:</strong>
              </p>
              <ul className="list-disc pl-5">
                <li><strong>/</strong> - Åpne søk i Samtaler eller Kunnskapsbase</li>
                <li><strong>ESC</strong> - Lukk åpne dialogbokser</li>
                <li><strong>Tab</strong> - Naviger mellom elementer</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};
