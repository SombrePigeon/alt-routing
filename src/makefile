# Trouver tous les répertoires contenant un fichier content.html
SUBDIRS := $(shell find . -type f -name 'content.html' -exec dirname {} \;)

# Règle principale pour générer les fichiers index.html
all: generate-index

generate-index:
	@./generate_indexes.sh

# Règle pour nettoyer les fichiers index.html générés
clean:
	@echo "Nettoyage des fichiers index.html"
	@find . -type f -name 'index.html' -delete

# Règle pour lister les répertoires
ls:
	@echo "Liste des répertoires du projet :"
	@find . -type d -not -path '*/\.*' -exec echo "- {}" \;

.PHONY: all clean ls generate-index
