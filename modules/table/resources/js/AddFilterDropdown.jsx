import { trans } from './translations.js'
import Dropdown from './Dropdown'
import DropdownButton from './DropdownButton'
import DropdownHeader from './DropdownHeader'
import DropdownItem from './DropdownItem'
import DropdownSeparator from './DropdownSeparator'
import { Filter, Plus } from 'lucide-react';

export default function AddFilterDropdown({ filters, state, onAdd }) {
    return (
        <Dropdown className="it-add-filter-dropdown">
            {{
                trigger: () => (
                    <DropdownButton
                        title={trans('filters_button')}
                        icon={<Filter />}
                    />
                ),
                content: () => (
                    <>
                        <DropdownHeader>{trans('add_filter_header')}</DropdownHeader>
                        <DropdownSeparator />
                        {filters.map((filter, key) => (
                            <DropdownItem
                                key={key}
                                title={filter.label}
                                disabled={state[filter.attribute].enabled}
                                hideIcon={state[filter.attribute].enabled}
                                onClick={() => onAdd(filter)}
                                icon={<Plus />}
                            />
                        ))}
                    </>
                ),
            }}
        </Dropdown>
    )
}
