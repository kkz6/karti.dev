<?php

namespace Modules\Billing\Support;

class BillingPermissions
{
    public const CATALOGUE = [
        'view any tax rate', 'view tax rate', 'create tax rate', 'update tax rate', 'archive tax rate', 'restore tax rate',
        'view billing settings', 'update billing settings',
    ];

    public const DRAFTS = ['view any invoice', 'view invoice', 'create invoice', 'update invoice'];

    public const ISSUANCE = ['issue invoice', 'cancel invoice'];

    public const PAYMENTS = ['view any payment', 'view payment', 'record payment', 'reverse payment'];

    public const PDF = ['download invoice'];

    public const EMAIL = ['send invoice'];

    public const LINKS = ['share invoice'];

    public const REMINDERS = ['remind invoice'];

    public const RECURRING = ['view any recurring invoice', 'view recurring invoice', 'create recurring invoice', 'update recurring invoice'];

    public const ONLINE = ['checkout invoice', 'view payment reconciliation', 'link consultation customer'];

    public const ACCOUNTING = ['view any credit note', 'view credit note', 'create credit note', 'update credit note', 'issue credit note', 'allocate credit note', 'reverse allocation credit note', 'refund credit note', 'cancel credit note', 'view statement', 'import billing data'];

    public const ALL = [...CustomerPermissions::ALL, ...self::CATALOGUE, ...self::DRAFTS, ...self::ISSUANCE, ...self::PAYMENTS, ...self::PDF, ...self::EMAIL, ...self::LINKS, ...self::REMINDERS, ...self::RECURRING, ...self::ONLINE, ...self::ACCOUNTING];
}
