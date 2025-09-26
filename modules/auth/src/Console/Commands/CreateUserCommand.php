<?php

namespace Modules\Auth\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Modules\Auth\Models\User;
use Spatie\Permission\Models\Role;

class CreateUserCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:create 
                            {--name= : The name of the user}
                            {--email= : The email address of the user}
                            {--password= : The password for the user}
                            {--admin : Make the user an admin}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a new user account';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Get user input
        $name = $this->option('name') ?? $this->ask('What is the user\'s name?');
        $email = $this->option('email') ?? $this->ask('What is the user\'s email address?');
        $password = $this->option('password') ?? $this->secret('What is the user\'s password?');
        $isAdmin = $this->option('admin') || $this->confirm('Should this user be an admin?', false);

        // Validate input
        $validator = Validator::make([
            'name' => $name,
            'email' => $email,
            'password' => $password,
        ], [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        if ($validator->fails()) {
            $this->error('Validation failed:');
            foreach ($validator->errors()->all() as $error) {
                $this->error('  - ' . $error);
            }
            return 1;
        }

        try {
            // Create the user
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
                'email_verified_at' => now(),
            ]);

            // Assign admin role if requested
            if ($isAdmin) {
                // Check if we're using Spatie Permission package
                if (method_exists($user, 'assignRole')) {
                    // Create admin role if it doesn't exist
                    $adminRole = Role::firstOrCreate(['name' => 'admin']);
                    $user->assignRole($adminRole);
                    $this->info('Admin role assigned to the user.');
                }
            }

            $this->info('User created successfully!');
            $this->table(
                ['ID', 'Name', 'Email', 'Admin'],
                [[$user->id, $user->name, $user->email, $isAdmin ? 'Yes' : 'No']]
            );

            return 0;

        } catch (\Exception $e) {
            $this->error('Failed to create user: ' . $e->getMessage());
            return 1;
        }
    }
}