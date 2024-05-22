# Trouver tous les répertoires contenant un fichier content.html
SUBDIRS := $(shell find . -type f -name 'content.html' -exec dirname {} \;)

# Règle principale pour générer les fichiers index.html
all: $(foreach dir,$(SUBDIRS),$(dir)/index.html)

# Règle pour chaque index.html
%index.html: %content.html index.template.html
	@echo "Génération de $@"
	sed 's/\$${content.html}/$(shell cat $< | sed 's/\//\\\//g')/g' index.template.html > $@

# Règle pour nettoyer les fichiers index.html générés
clean:
	@echo "Nettoyage des fichiers index.html"
	@find . -type f -name 'index.html' -delete

ls:
	@echo "Liste des répertoires du projet :"
	@echo $(SUBDIRS)

.PHONY: all clean ls