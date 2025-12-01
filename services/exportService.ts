
export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert("Aucune donnée à exporter.");
    return;
  }

  // Récupérer les en-têtes depuis le premier objet
  const headers = Object.keys(data[0]);
  
  // Construire le contenu CSV
  const csvContent = [
    headers.join(','), // Ligne d'en-tête
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] === null || row[header] === undefined ? '' : row[header];
        // Échapper les guillemets et entourer de guillemets si contient virgule, saut de ligne ou guillemets
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Créer le Blob et le lien de téléchargement
  // Utilisation de l'encodage UTF-8 avec BOM pour une bonne ouverture dans Excel
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
