<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consultation_bookings', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('profession');
            $table->text('message')->nullable();
            $table->string('timezone')->default('Asia/Kolkata');
            $table->dateTime('slot_start');
            $table->dateTime('slot_end')->nullable();
            $table->enum('status', ['pending', 'confirmed', 'cancelled', 'expired'])->default('pending');
            $table->string('payment_id')->nullable()->index();
            $table->string('payment_link')->nullable();
            $table->string('calcom_booking_uid')->nullable();
            $table->string('reservation_uid')->nullable();
            $table->json('calcom_data')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('email');
            $table->index('slot_start');
        });
    }
};
