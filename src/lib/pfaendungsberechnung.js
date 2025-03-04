// pfaendungsberechnung.js

export const pfaendungstabelle = [
    { min: 0, max: 1499.99, pfaendungsbetraege: [0, 0, 0, 0, 0, 0] },
    { min: 1500, max: 1509.99, pfaendungsbetraege: [5.78, 0, 0, 0, 0, 0] },
    { min: 1510, max: 1519.99, pfaendungsbetraege: [12.78, 0, 0, 0, 0, 0] },
    { min: 1520, max: 1529.99, pfaendungsbetraege: [19.78, 0, 0, 0, 0, 0] },
    { min: 1530, max: 1539.99, pfaendungsbetraege: [26.78, 0, 0, 0, 0, 0] },
    { min: 1540, max: 1549.99, pfaendungsbetraege: [33.78, 0, 0, 0, 0, 0] },
    { min: 1550, max: 1559.99, pfaendungsbetraege: [40.78, 0, 0, 0, 0, 0] },
    // ... [Der Rest der Tabelle wird hier aus Platzgründen gekürzt] ...
    { min: 3000, max: 3009.99, pfaendungsbetraege: [1055.78, 473.41, 253.62, 96.38, 1.70, 0] },
    { min: 4570, max: 4573.10, pfaendungsbetraege: [2154.78, 1258.41, 881.62, 567.38, 315.70, 126.57] }
];

/**
 * Berechnet den pfändbaren Betrag basierend auf dem Nettoeinkommen und der Anzahl der unterhaltsberechtigten Personen
 * @param {number} nettoeinkommen - Monatliches Nettoeinkommen
 * @param {number} kinderAnzahl - Anzahl der unterhaltsberechtigten Kinder
 * @returns {number} Pfändbarer Betrag für 3 Monate
 */
export function getPfaendungsbetrag(nettoeinkommen, kinderAnzahl) {
    // Sicherheitscheck für die Eingaben
    if (!nettoeinkommen || nettoeinkommen < 0) return 0;

    // Beträge über 4.573,10 sind voll pfändbar
    if (nettoeinkommen > 4573.10) {
        return nettoeinkommen * 3;
    }

    // Finde den passenden Bereich in der Tabelle
    const bereich = pfaendungstabelle.find(
        eintrag => nettoeinkommen >= eintrag.min && nettoeinkommen <= eintrag.max
    );

    if (!bereich) return 0;

    // Bestimme den Index für die Kinderanzahl (max 5)
    const kinderIndex = Math.min(kinderAnzahl, 5);

    // Hole den monatlichen Pfändungsbetrag
    const monatsPfaendung = bereich.pfaendungsbetraege[kinderIndex];

    // Berechne den Gesamtbetrag für 3 Monate
    return monatsPfaendung * 3;
}

/**
 * Hilfsfunktion zur Formatierung von Geldbeträgen
 * @param {number} betrag - Der zu formatierende Geldbetrag
 * @returns {string} Formatierter Geldbetrag
 */
export function formatiereBetrag(betrag) {
    return betrag.toFixed(2).replace('.', ',') + ' €';
}

/**
 * Berechnet den Gesamtpreis basierend auf beiden Berechnungsmethoden
 * @param {Object} params - Die Parameter für die Berechnung
 * @returns {Object} Das Ergebnis der Preisberechnung
 */
export function berechnePreise({ nettoeinkommen, kinderAnzahl, glaeubiger }) {
    // Standardpreisberechnung
    const startgebuehr = 799;
    const preisProGlaeubiger = 39;
    const basisPreis = startgebuehr + (glaeubiger * preisProGlaeubiger);

    // Pfändungsberechnung für 3 Monate
    const pfaendungsPreis = getPfaendungsbetrag(nettoeinkommen, kinderAnzahl);

    // Ermittle den höheren Preis
    const gesamtPreis = Math.max(basisPreis, pfaendungsPreis);

    return {
        startgebuehr,
        glaeubigerKosten: glaeubiger * preisProGlaeubiger,
        pfaendungsPreis,
        gesamtPreis,
        berechnungsArt: pfaendungsPreis > basisPreis ? 'Pfändungsberechnung' : 'Standardberechnung',
        monatlichePfaendung: pfaendungsPreis / 3
    };
}