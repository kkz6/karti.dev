import { router } from '@inertiajs/react'
import { getActionForItem, getClickableColumn, replaceUrlWithRouter, visitUrlWithRouter, visitUrlWithModal } from '../../vue/src/agnosticUrlHelpers'

function visitUrl(url) {
    visitUrlWithRouter(url, router)
}

function visitModal(url, visitModal) {
    return visitUrlWithModal(url, visitModal)
}

function replaceUrl(url) {
    return replaceUrlWithRouter(url, router)
}

export { getActionForItem, getClickableColumn, replaceUrl, visitUrl, visitModal }
