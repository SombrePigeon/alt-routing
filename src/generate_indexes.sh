#!/bin/bash

# Fichier template et output
TEMPLATE="index.template.html"
OUTPUT="index.html"

# Fonction pour remplacer les motifs ${nomDuFichier} par le contenu de nomDuFichier
replace_patterns() {
    local template_content=$(cat "$TEMPLATE")
    local dir=$1

    for file in "$dir"/*.html; do
        if [[ -f "$file" && "$file" != *"$OUTPUT" ]]; then
            filename=$(basename "$file")
            file_content=$(awk '{printf "%s", $0}' "$file" )
            template_content=$(echo "$template_content" | awk -v pattern="${filename}" -v content="$file_content" '{gsub("\\${" pattern "}", content)}1')
        fi
    done

    echo "$template_content" > "$dir/$OUTPUT"
}

# Appliquer la fonction à chaque répertoire contenant un fichier content.html
for dir in $(find . -type f -name 'content.html' -exec dirname {} \;); do
    replace_patterns "$dir"
    echo "Génération de $dir/$OUTPUT"
done
