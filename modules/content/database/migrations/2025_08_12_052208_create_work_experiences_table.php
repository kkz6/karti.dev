<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('work_experiences', function (Blueprint $table) {
            $table->id();
            $table->string('company');
            $table->string('position');
            $table->text('description')->nullable();
            $table->string('logo')->nullable();
            $table->string('company_url')->nullable();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->boolean('current')->default(false);
            $table->integer('sort_order')->default(0);
            $table->boolean('featured')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['current', 'sort_order']);
            $table->index(['featured', 'start_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('work_experiences');
    }
};
