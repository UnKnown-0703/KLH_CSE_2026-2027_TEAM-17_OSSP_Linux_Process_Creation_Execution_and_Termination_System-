# ==============================================================================
# OPERATING SYSTEMS & SYSTEMS PROGRAMMING (OSSP)
# Project: Multi-Process Command Pipeline System
# Team 17 - Hackathon
# ==============================================================================

CC = gcc
CFLAGS = -Wall -Wextra -O2 -g -D_GNU_SOURCE
TARGET = ../bin/pipeline_engine
SOURCES = pipeline_engine.c pipeline_parser.c pipeline_monitor.c
OBJECTS = $(SOURCES:.c=.o)

.PHONY: all clean test help

all: $(TARGET)

$(TARGET): $(OBJECTS)
	@mkdir -p ../bin
	$(CC) $(CFLAGS) -o $@ $^
	@echo "Build successful: $(TARGET)"

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f *.o $(TARGET)
	@echo "Cleaned build artifacts."

test: $(TARGET)
	@echo "Running verification test suite..."
	$(TARGET) "cat ../data/access_log.txt | grep 404 | wc -l"
	$(TARGET) --explain "cat ../data/words.txt | tr -s ' ' '\n' | sort | uniq -c | sort -nr | head -n 5"

help:
	@echo "Available targets:"
	@echo "  make        - Compile pipeline_engine binary to ../bin/"
	@echo "  make test   - Compile and execute sample pipeline tests"
	@echo "  make clean  - Remove object files and compiled binary"
