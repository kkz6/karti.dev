<?php

declare(strict_types=1);

namespace Modules\Table\Http;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Table\Action;

class ActionRequest extends FormRequest
{
    use ResolvesTableInstance;

    /**
     * Merge the route parameters into the request.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'table'  => $this->route('table'),
            'name'   => $this->route('name'),
            'action' => $this->route('action'),
            'state'  => $this->route('state'),
        ]);
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->getAction()->isAuthorized($this);
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'table'  => ['required', 'string', new Base64EncodedTableClassRule],
            'name'   => ['required', 'string', 'min:1', 'max:255'],
            'action' => ['required', 'integer', 'min:0', 'max:100'],
            'keys'   => ['required', 'array', 'min:1'],
            'state'  => ['nullable', 'string'],
        ];
    }

    /**
     * Get the Action instance.
     */
    public function getAction(): Action
    {
        $table = $this->getTable();

        $action = $table->actions()[$this->route('action')] ?? null;

        abort_if(is_null($action), 404);

        return $action->setTable($table);
    }
}
