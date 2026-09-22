#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>

int main()
{
    int choice = 0;
    int pid;

    printf("Linux Process Management System\n");

    printf("\n1. List files (ls)\n");
    printf("2. Show current directory (pwd)\n");
    printf("3. Show date and time (date)\n");
    printf("4. Show username (whoami)\n");

    printf("\nEnter your choice: ");
    scanf("%d", &choice);

    // Step 1: Process creation
    pid = fork();

    if (pid == 0)
    {
        // Child process
        printf("\nChild Process\n");
        printf("Child PID: %d\n", getpid());

        // Step 2: Process execution
        if (choice == 1)
        {
            execl("/bin/ls", "ls", "-l", (char *)NULL);
        }
        else if (choice == 2)
        {
            execl("/bin/pwd", "pwd", (char *)NULL);
        }
        else if (choice == 3)
        {
            execl("/bin/date", "date", (char *)NULL);
        }
        else if (choice == 4)
        {
            execl("/usr/bin/whoami", "whoami", (char *)NULL);
        }
        else
        {
            printf("Invalid choice!\n");
        }

        // Reached only if exec failed or choice was invalid
        exit(1);
    }
    else if (pid > 0)
    {
        // Parent process
        printf("Parent Process\n");
        printf("Parent PID: %d\n", getpid());

        // Step 3: Synchronization (parent waits for child)
        wait(NULL);

        // Step 4: Termination
        printf("\nChild process completed\n");
    }
    else
    {
        printf("Fork failed\n");
    }

    return 0;
}
