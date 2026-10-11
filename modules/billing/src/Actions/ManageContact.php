<?php

namespace Modules\Billing\Actions;

use Illuminate\Support\Facades\DB;
use Modules\Billing\Models\Contact;
use Modules\Billing\Models\Customer;

class ManageContact
{
    public function save(Customer $customer, array $data, ?Contact $contact = null): Contact
    {
        return DB::transaction(function () use ($customer, $data, $contact) {
            $locked = Customer::whereKey($customer->id)->lockForUpdate()->firstOrFail();
            abort_if($locked->archived_at !== null, 409, 'Restore this customer before managing contacts.');
            $contact = $contact ? $locked->contacts()->whereKey($contact->id)->firstOrFail() : new Contact;
            abort_if($contact->archived_at !== null, 409, 'Restore this contact before editing it.');
            if ($data['is_primary']) {
                $locked->contacts()->where('primary_slot', 1)->where('id', '!=', $contact->id ?? 0)->update(['primary_slot' => null]);
            }
            $contact->fill($data);
            $contact->customer_id  = $locked->id;
            $contact->primary_slot = $data['is_primary'] ? 1 : null;
            $contact->save();
            $this->ensurePrimary($locked);

            return $contact->refresh();
        });
    }

    public function setArchived(Customer $customer, Contact $contact, bool $archive): void
    {
        DB::transaction(function () use ($customer, $contact, $archive) {
            $locked = Customer::whereKey($customer->id)->lockForUpdate()->firstOrFail();
            abort_if($locked->archived_at !== null, 409, 'Restore this customer before managing contacts.');
            $contact = $locked->contacts()->whereKey($contact->id)->firstOrFail();
            if (($contact->archived_at !== null) === $archive) {
                return;
            }
            $contact->archived_at  = $archive ? ($contact->archived_at ?? now()) : null;
            $contact->primary_slot = null;
            $contact->save();
            $this->ensurePrimary($locked);
        });
    }

    private function ensurePrimary(Customer $customer): void
    {
        if (! $customer->contacts()->whereNull('archived_at')->where('primary_slot', 1)->exists()) {
            $first = $customer->contacts()->whereNull('archived_at')->first();
            if ($first) {
                $first->primary_slot = 1;
                $first->save();
            }
        }
    }
}
