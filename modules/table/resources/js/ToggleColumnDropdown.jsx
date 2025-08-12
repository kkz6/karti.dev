import { trans } from './translations.js'
import Dropdown from './Dropdown'
import DropdownButton from './DropdownButton'
import DropdownHeader from './DropdownHeader'
import DropdownItem from './DropdownItem'
import DropdownSeparator from './DropdownSeparator'
import { Check, Eye } from 'lucide-react';

export default function ToggleColumnDropdown({ columns, state, onToggle }) {
    return (
        <Dropdown className="it-toggle-column-dropdown">
            {{
                trigger: () => (
                    <DropdownButton
                        title={trans('columns_button')}
                        icon={<Eye />}
                    />
                ),
                content: () => (
                    <>
                        <DropdownHeader>{trans('toggle_columns_header')}</DropdownHeader>
                        <DropdownSeparator />
                        {columns.map(
                            (column, key) =>
                                column.header && (
                                    <DropdownItem
                                        key={key}
                                        title={column.header}
                                        checked={state[column.attribute]}
                                        hideIcon={!state[column.attribute]}
                                        disabled={!column.toggleable}
                                        onClick={() => onToggle(column)}
                                        icon={<Check />}
                                    />
                                ),
                        )}
                    </>
                ),
            }}
        </Dropdown>
    )
}
