"use client";

import React from "react";
import { PageHeader } from "@/components/ui/PageHeader";

export default function TermeniSiConditiiPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <PageHeader
        title="Termeni și Condiții de Utilizare"
        description="Ultima actualizare: Aprilie 2026"
      />

      <div className="prose prose-blue dark:prose-invert max-w-none space-y-6">

        {/* 1 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            1. Dispoziții Generale
          </h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            <p>1.1. Prezentul document stabilește termenii și condițiile de utilizare a platformei online operată de KODERS S.R.L.</p>
            <p>1.2. Accesarea și utilizarea platformei implică acceptarea integrală și necondiționată a acestor termeni de către Utilizator.</p>
            <p>1.3. În cazul în care Utilizatorul nu este de acord cu prevederile prezentului document, acesta are obligația de a înceta utilizarea platformei.</p>
            <p>1.4. KODERS S.R.L. își rezervă dreptul de a modifica oricând conținutul prezentului document, modificările urmând a produce efecte de la data publicării pe platformă.</p>
          </div>
        </section>

        {/* 2 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            2. Definiții
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">În sensul prezentului document:</p>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 text-sm space-y-1.5">
            <li><strong>Platforma</strong> – aplicația software disponibilă online la adresa app.koders.ro;</li>
            <li><strong>Prestatorul</strong> – KODERS S.R.L., CUI 52494004, înregistrată la Registrul Comerțului;</li>
            <li><strong>Utilizatorul</strong> – orice persoană juridică sau entitate care utilizează platforma;</li>
            <li><strong>Serviciile</strong> – funcționalitățile oferite prin intermediul platformei;</li>
            <li><strong>Cont</strong> – ansamblul datelor de autentificare și informațiilor asociate unui utilizator;</li>
            <li><strong>Abonament</strong> – serviciul cu plată care permite accesul continuu la platformă.</li>
          </ul>
        </section>

        {/* 3 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            3. Descrierea Serviciilor
          </h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            <p>3.1. Platforma oferă servicii informatice constând în generarea și gestionarea de documente și date introduse de Utilizator.</p>
            <p>3.2. Serviciile sunt furnizate exclusiv pe baza datelor introduse de Utilizator, fără intervenție umană din partea Prestatorului.</p>
            <p>3.3. Prestatorul nu verifică, nu validează și nu garantează corectitudinea informațiilor introduse sau a documentelor generate.</p>
            <p>3.4. Utilizatorul este singurul responsabil pentru utilizarea rezultatelor generate prin intermediul platformei.</p>
          </div>
        </section>

        {/* 4 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            4. Crearea și Administrarea Contului
          </h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            <p>4.1. Utilizarea serviciilor este condiționată de crearea unui cont.</p>
            <p>4.2. Utilizatorul are obligația de a furniza informații reale, complete și actualizate.</p>
            <p>4.3. Utilizatorul este responsabil pentru confidențialitatea datelor de autentificare și pentru toate activitățile desfășurate prin intermediul contului.</p>
            <p>4.4. Prestatorul nu răspunde pentru prejudiciile rezultate din utilizarea neautorizată a contului.</p>
          </div>
        </section>

        {/* 5 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            5. Perioada de Încercare (Trial)
          </h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            <p>5.1. Prestatorul poate oferi o perioadă de utilizare gratuită limitată în timp.</p>
            <p>5.2. Perioada de trial este acordată o singură dată per Utilizator sau entitate juridică.</p>
            <p>5.3. Este interzisă crearea de conturi multiple în scopul obținerii repetate a perioadei de trial.</p>
            <p>5.4. Prestatorul își rezervă dreptul de a suspenda sau șterge conturile care încalcă această prevedere, fără notificare prealabilă.</p>
          </div>
        </section>

        {/* 6 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            6. Tarife, Facturare și Plăți
          </h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            <p>6.1. Accesul la servicii este condiționat de achitarea abonamentului aferent.</p>
            <p>6.2. Plățile sunt procesate prin intermediul unui furnizor terț autorizat.</p>
            <p>6.3. Prin activarea abonamentului, Utilizatorul acceptă debitarea automată recurentă.</p>
            <p>6.4. În cazul în care plata nu poate fi procesată, accesul la servicii poate fi suspendat imediat.</p>
            <p>6.5. Sumele achitate nu sunt rambursabile, indiferent de motiv, inclusiv în cazul neutilizării serviciului.</p>
          </div>
        </section>

        {/* 7 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            7. Durata și Încetarea Utilizării
          </h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            <p>7.1. Contractul dintre părți se consideră încheiat pe durata utilizării platformei.</p>
            <p>7.2. Utilizatorul poate înceta utilizarea serviciilor în orice moment prin dezactivarea abonamentului.</p>
            <p>7.3. Prestatorul poate suspenda sau înceta accesul Utilizatorului în cazul încălcării prezentelor condiții.</p>
          </div>
        </section>

        {/* 8 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            8. Drepturi de Proprietate Intelectuală
          </h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            <p>8.1. Toate drepturile asupra platformei aparțin Prestatorului.</p>
            <p>8.2. Este interzisă copierea, distribuirea, modificarea sau utilizarea neautorizată a platformei.</p>
          </div>
        </section>

        {/* 9 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            9. Limitarea Răspunderii
          </h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            <p>9.1. Serviciile sunt furnizate fără garanții explicite sau implicite privind funcționarea neîntreruptă sau lipsa erorilor.</p>
            <p>9.2. Prestatorul nu răspunde pentru:</p>
            <ul className="list-disc pl-6 space-y-1 mt-1">
              <li>erori generate de datele introduse de Utilizator;</li>
              <li>pierderi financiare sau comerciale;</li>
              <li>pierderea sau deteriorarea datelor;</li>
              <li>utilizarea necorespunzătoare a documentelor generate.</li>
            </ul>
            <p>9.3. Răspunderea totală a Prestatorului, dacă aceasta este stabilită, este limitată la valoarea abonamentului achitat de Utilizator pentru o perioadă de maximum o lună.</p>
          </div>
        </section>

        {/* 10 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            10. Disponibilitatea Serviciilor
          </h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            <p>10.1. Prestatorul nu garantează disponibilitatea permanentă a platformei.</p>
            <p>10.2. Serviciile pot fi întrerupte temporar pentru mentenanță sau din motive tehnice.</p>
          </div>
        </section>

        {/* 11 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            11. Protecția Datelor
          </h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            <p>11.1. Prelucrarea datelor se realizează conform Politicii de Confidențialitate.</p>
          </div>
        </section>

        {/* 12 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            12. Lege Aplicabilă
          </h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            <p>12.1. Prezentul document este guvernat de legislația română.</p>
            <p>12.2. Litigiile vor fi soluționate de instanțele competente din România.</p>
          </div>
        </section>

      </div>
    </div>
  );
}
