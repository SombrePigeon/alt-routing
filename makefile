ifeq ($(WEBSITES_ENV), prod)
 $(info prod $(WEBSITES_ENV) detected)
 COMPOSE_FILE=docker-compose.yml
else ifeq ($(WEBSITES_ENV), dev)
 $(info prod $(WEBSITES_ENV) detected)
 COMPOSE_FILE=docker-compose-dev.yml
else
 $(error : WEBSITES_ENV is not defined to "dev" or "prod";)
endif

update: update-check
	$(MAKE) .update

.update: $(COMPOSE_FILE) Dockerfile 
	$(MAKE) down
	docker-compose -f $(COMPOSE_FILE) up -d --build
	@touch .update

down:
	docker-compose -f $(COMPOSE_FILE) down
	@rm -f .update

update-check:
	docker-compose ps -q | grep -q "" || rm -f .update

hash:
	@echo "calcul du hash"
	@find . -type f -print0 | sort -z | xargs -0 sha1sum | sha1sum > html/hash.txt

.PHONY: update update-check down