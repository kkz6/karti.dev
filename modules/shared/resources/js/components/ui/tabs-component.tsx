'use client';

import { Tabs } from '@ark-ui/react/tabs';
export { ContentTabs, type ContentTab } from './tabs-in-cell-for-navigation';
const exampleTabs = [
    { value: 'tab1', label: 'Dashboard', content: 'Main dashboard with key metrics and insights.' },
    { value: 'tab2', label: 'Analytics', content: 'Track performance with detailed reports.' },
    { value: 'tab3', label: 'Settings', content: 'Configure preferences and account options.' },
];
export default function TabsBasic() {
    return (
        <div className="flex w-full flex-col items-center rounded-xl bg-white px-4 py-12 dark:bg-gray-800">
            <Tabs.Root defaultValue="tab1" className="flex w-full flex-col items-center">
                <Tabs.List className="mb-8 flex w-fit gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
                    {exampleTabs.map((tab) => (
                        <Tabs.Trigger
                            key={tab.value}
                            value={tab.value}
                            className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 transition-all data-selected:bg-white data-selected:text-gray-900 data-selected:shadow-sm dark:text-gray-300 dark:data-selected:bg-gray-800 dark:data-selected:text-gray-100"
                        >
                            {tab.label}
                        </Tabs.Trigger>
                    ))}
                </Tabs.List>
                {exampleTabs.map((tab) => (
                    <Tabs.Content key={tab.value} value={tab.value} className="text-center text-gray-600 dark:text-gray-300">
                        {tab.content}
                    </Tabs.Content>
                ))}
            </Tabs.Root>
        </div>
    );
}
