"use client";

import React from "react";
import { PageHeader } from "@/components/ui/PageHeader";

export default function PoliticaConfidentialitatePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <PageHeader
        title="Politică de Confidențialitate"
        description="Ultima actualizare: Aprilie 2026"
      />

      <div className="prose prose-blue dark:prose-invert max-w-none space-y-6">

        {/* 1 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            1. Dispoziții Generale
          </h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            <p>1.1. Prezenta Politică de Confidențialitate reglementează modul în care KODERS S.R.L. prelucrează datele cu caracter personal în cadrul platformei online disponibile la adresa app.koders.ro.</p>
            <p>1.2. KODERS S.R.L. respectă dispozițiile legislației aplicabile privind protecția datelor cu caracter personal, inclusiv Regulamentul (UE) 2016/679 (GDPR).</p>
            <p>1.3. Prin utilizarea platformei, Utilizatorul confirmă că a luat cunoștință de prezenta politică.</p>
          </div>
        </section>

        {/* 2 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            2. Operatorul și Date de Contact
          </h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            <p>2.1. Operatorul datelor este:</p>
            <p className="pl-4">
              KODERS S.R.L.<br />
              CUI: 52494004<br />
              Nr. înregistrare: J2025069335009
            </p>
            <p>2.2. Pentru orice solicitări privind protecția datelor, Utilizatorii pot contacta:</p>
            <p className="pl-4">Email: <strong>contact@koders.ro</strong></p>
          </div>
        </section>

        {/* 3 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            3. Categorii de Date Prelucrate
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">3.1. În cadrul utilizării platformei, pot fi prelucrate următoarele categorii de date:</p>
          <div className="space-y-3 text-gray-700 dark:text-gray-300 text-sm">
            <div>
              <p className="font-medium mb-1">a) Date ale Utilizatorului (persoană juridică / reprezentanți)</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>denumire firmă;</li>
                <li>CUI;</li>
                <li>adresă sediu;</li>
                <li>date de contact (email, telefon);</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">b) Date introduse în platformă de Utilizator</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>date ale clienților finali;</li>
                <li>informații incluse în devize;</li>
                <li>alte informații introduse în mod voluntar;</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">c) Semnături electronice simple</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>reprezentări digitale ale semnăturii introduse de Utilizator;</li>
                <li>date asociate semnării documentelor generate;</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">d) Date tehnice</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>adresă IP;</li>
                <li>informații despre dispozitiv;</li>
                <li>date privind sesiunea și autentificarea;</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 4 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            4. Scopurile Prelucrării
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">Datele sunt prelucrate exclusiv pentru:</p>
          <div className="space-y-1 text-gray-700 dark:text-gray-300 text-sm">
            <p>4.1. furnizarea serviciilor oferite prin platformă;</p>
            <p>4.2. generarea și gestionarea documentelor;</p>
            <p>4.3. administrarea contului Utilizatorului;</p>
            <p>4.4. asigurarea securității și prevenirea fraudelor;</p>
            <p>4.5. respectarea obligațiilor legale aplicabile.</p>
          </div>
        </section>

        {/* 5 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            5. Temeiul Legal al Prelucrării
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">Prelucrarea datelor se realizează în baza:</p>
          <div className="space-y-1 text-gray-700 dark:text-gray-300 text-sm">
            <p>5.1. executării contractului (art. 6 alin. 1 lit. b GDPR);</p>
            <p>5.2. obligațiilor legale (art. 6 alin. 1 lit. c GDPR);</p>
            <p>5.3. interesului legitim al operatorului (art. 6 alin. 1 lit. f GDPR), în special pentru securitate și prevenirea abuzurilor.</p>
          </div>
        </section>

        {/* 6 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            6. Prelucrarea în Calitate de Împuternicit (DPA)
          </h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            <p>6.1. În măsura în care Utilizatorul introduce în platformă date cu caracter personal ale clienților săi, acesta are calitatea de Operator de date, iar KODERS S.R.L. acționează în calitate de Împuternicit.</p>
            <p>6.2. KODERS S.R.L. prelucrează aceste date:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>exclusiv în baza instrucțiunilor Utilizatorului;</li>
              <li>strict în scopul furnizării serviciilor;</li>
            </ul>
            <p>6.3. KODERS S.R.L. nu utilizează aceste date în scop propriu și nu le divulgă către terți, cu excepția cazurilor prevăzute de lege sau necesare pentru furnizarea serviciului.</p>
          </div>
        </section>

        {/* 7 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            7. Semnături Electronice Simple
          </h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            <p>7.1. Platforma poate permite utilizarea de semnături electronice simple.</p>
            <p>7.2. Aceste semnături:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>sunt generate pe baza datelor introduse de Utilizator;</li>
              <li>nu constituie semnături electronice calificate în sensul legislației aplicabile;</li>
            </ul>
            <p>7.3. Utilizatorul este singurul responsabil pentru:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>utilizarea acestor semnături;</li>
              <li>validitatea juridică a documentelor semnate;</li>
            </ul>
            <p>7.4. KODERS S.R.L. nu garantează recunoașterea juridică a documentelor semnate prin intermediul platformei.</p>
          </div>
        </section>

        {/* 8 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            8. Stocarea și Durata Prelucrării
          </h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            <p>8.1. Datele sunt stocate pe servere securizate.</p>
            <p>8.2. Datele sunt păstrate:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>pe durata existenței contului;</li>
              <li>ulterior, pe perioada necesară respectării obligațiilor legale;</li>
            </ul>
            <p>8.3. După încetarea relației contractuale, datele pot fi șterse sau anonimizate, în funcție de obligațiile legale aplicabile.</p>
          </div>
        </section>

        {/* 9 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            9. Securitatea Datelor
          </h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            <p>9.1. KODERS S.R.L. implementează măsuri tehnice și organizatorice adecvate pentru protejarea datelor.</p>
            <p>9.2. Cu toate acestea, nu se poate garanta securitatea absolută a transmisiilor prin internet.</p>
          </div>
        </section>

        {/* 10 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            10. Divulgarea Datelor
          </h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            <p>10.1. Datele pot fi divulgate către:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>furnizori de servicii IT (hosting, procesare plăți);</li>
              <li>autorități publice, atunci când există obligații legale;</li>
            </ul>
            <p>10.2. Toți partenerii sunt obligați să respecte cerințele privind protecția datelor.</p>
          </div>
        </section>

        {/* 11 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            11. Transferuri Internaționale
          </h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            <p>11.1. Datele nu sunt transferate în afara Spațiului Economic European, cu excepția situațiilor în care există garanții adecvate conform legislației aplicabile.</p>
          </div>
        </section>

        {/* 12 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            12. Drepturile Persoanelor Vizate
          </h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            <p>12.1. Persoanele vizate au următoarele drepturi:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>dreptul de acces;</li>
              <li>dreptul la rectificare;</li>
              <li>dreptul la ștergere;</li>
              <li>dreptul la restricționare;</li>
              <li>dreptul la portabilitatea datelor;</li>
              <li>dreptul la opoziție;</li>
            </ul>
            <p>12.2. Aceste drepturi pot fi exercitate prin transmiterea unei solicitări la: <strong>contact@koders.ro</strong></p>
            <p>12.3. KODERS S.R.L. va răspunde solicitărilor în termenul prevăzut de legislația aplicabilă.</p>
          </div>
        </section>

        {/* 13 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            13. Cookies
          </h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            <p>13.1. Platforma utilizează exclusiv cookies strict necesare funcționării.</p>
            <p>13.2. Nu sunt utilizate cookies pentru:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>analiză;</li>
              <li>marketing;</li>
              <li>profilare.</li>
            </ul>
          </div>
        </section>

        {/* 14 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            14. Modificări ale Politicii
          </h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            <p>14.1. KODERS S.R.L. își rezervă dreptul de a modifica prezenta politică.</p>
            <p>14.2. Modificările vor fi publicate pe platformă și vor intra în vigoare de la data publicării.</p>
          </div>
        </section>

        {/* 15 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            15. Dispoziții Finale
          </h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            <p>15.1. Prezenta politică se completează cu Termenii și Condițiile de utilizare.</p>
            <p>15.2. În cazul unor neclarități, interpretarea se va face în conformitate cu legislația aplicabilă privind protecția datelor.</p>
          </div>
        </section>

      </div>
    </div>
  );
}
