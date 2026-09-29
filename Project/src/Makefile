CC = gcc
CFLAGS = -Wall -Wextra -O2 -g -D_GNU_SOURCE
TARGET = ../bin/process_system
SOURCES = main.c module_creation.c module_sync.c module_monitor.c
HEADERS = process_lifecycle.h

all: $(TARGET)

$(TARGET): $(SOURCES) $(HEADERS)
	mkdir -p ../bin
	$(CC) $(CFLAGS) $(SOURCES) -o $(TARGET)

clean:
	rm -f $(TARGET) *.o

.PHONY: all clean
