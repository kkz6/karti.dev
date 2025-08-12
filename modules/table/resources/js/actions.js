import { default as Axios } from 'axios'
import { useState, useMemo } from 'react'
import { router } from '@inertiajs/react'

export const useActions = () => {
    const [isPerformingAction, setIsPerformingAction] = useState(false)
    const [selectedItems, setSelectedItems] = useState([])

    const toggleItem = useMemo(
        () => (id) => {
            setSelectedItems((prevItems) => {
                if (id === '*') {
                    return prevItems.includes('*') ? [] : ['*']
                }
                if (prevItems.includes(id)) {
                    return prevItems.filter((item) => item !== id)
                } else {
                    return [...prevItems, id]
                }
            })
        },
        [],
    )

    const allItemsAreSelected = useMemo(() => selectedItems.includes('*'), [selectedItems])

    const makeExportUrl = (tableExport) => {
        if (!tableExport.limitToSelectedRows) {
            return tableExport.url
        }

        return `${tableExport.url}&keys=${selectedItems.join(',')}`
    }

    const performAsyncExport = (tableExport) => {
        return new Promise((resolve, reject) => {
            const keys = selectedItems

            setIsPerformingAction(true)

            Axios.post(makeExportUrl(tableExport))
                .then((response) => {
                    resolve({ keys, response })

                    if (!response.data.targetUrl) {
                        return
                    }

                    return router.visit(response.data.targetUrl, {
                        preserveState: true,
                        preserveScroll: true,
                    })
                })
                .catch((error) => reject({ keys, error }))
                .finally(() => {
                    setIsPerformingAction(false)
                    setSelectedItems([])
                })
        })
    }

    const performAction = (action, keys = null) => {
        return new Promise((resolve, reject) => {
            if (!action.authorized) {
                reject(new Error('Action not authorized'))
                return
            }

            if (!keys) {
                keys = selectedItems
            }

            setIsPerformingAction(true)

            if (action.isCustom) {
                resolve({
                    keys,
                    onFinish: () => {
                        setIsPerformingAction(false)
                        setSelectedItems([])
                    },
                })
                return
            }

            Axios.post(action.url, { keys, json: true })
                .then((response) => {
                    resolve({ keys, response })
                    router.visit(response.data.targetUrl, {
                        preserveState: true,
                        preserveScroll: true,
                    })
                })
                .catch((error) => {
                    reject({ keys, error })
                })
                .finally(() => {
                    setIsPerformingAction(false)
                    setSelectedItems([])
                })
        })
    }

    return {
        allItemsAreSelected,
        isPerformingAction,
        performAction,
        performAsyncExport,
        selectedItems,
        toggleItem,
    }
}
