<?php

namespace Modules\Billing\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Modules\Billing\Actions\ManageContact;
use Modules\Billing\Http\Requests\SaveContactRequest;
use Modules\Billing\Models\Contact;
use Modules\Billing\Models\Customer;
use Modules\Shared\Http\Controllers\BaseController;

class ContactsController extends BaseController
{
    public function store(SaveContactRequest $request, Customer $customer, ManageContact $action): RedirectResponse
    {
        $action->save($customer, $request->validated());

        return back()->with('billing_message', 'Contact added.');
    }

    public function update(SaveContactRequest $request, Customer $customer, Contact $contact, ManageContact $action): RedirectResponse
    {
        $action->save($customer, $request->validated(), $contact);

        return back()->with('billing_message', 'Contact updated.');
    }

    public function archive(Customer $customer, Contact $contact, ManageContact $action): RedirectResponse
    {
        $this->authorize('update', $customer);
        $action->setArchived($customer, $contact, true);

        return back()->with('billing_message', 'Contact archived.');
    }

    public function restore(Customer $customer, Contact $contact, ManageContact $action): RedirectResponse
    {
        $this->authorize('update', $customer);
        $action->setArchived($customer, $contact, false);

        return back()->with('billing_message', 'Contact restored.');
    }
}
