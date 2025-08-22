import { Button } from '@shared/components/ui/button';
import useBreakpoints from '@shared/hooks/useBreakpoints';
import clsx from 'clsx';
import React, { useEffect, useLayoutEffect, useRef } from 'react';

type ButtonProps = React.ComponentProps<typeof Button>;

interface ModalProps {
    active: boolean;
    onClickOutside: () => void;
    children: React.ReactNode;
    sticky?: boolean;
    initialFocusRef?: React.RefObject<HTMLButtonElement> | React.RefObject<null>;
}

interface ModalBodyProps {
    children: React.ReactNode;
    sticky?: boolean;
    className?: string;
}

interface ModalHeaderProps {
    children: React.ReactNode;
    sticky?: boolean;
}

const ModalModal = ({ active, onClickOutside, children, sticky, initialFocusRef }: ModalProps) => {
    const focusRef = useRef<HTMLButtonElement | null>(null);
    const { isMobile, isDesktop } = useBreakpoints();

    useLayoutEffect(() => {
        if (active) {
            if (initialFocusRef?.current) {
                initialFocusRef.current.focus();
            } else {
                if (focusRef.current) {
                    focusRef.current.focus();
                }
            }
        }
    }, [active, initialFocusRef?.current]);

    useEffect(() => {
        if (!active) {
            return;
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClickOutside();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [active, onClickOutside]);

    const childrenArray = React.Children.toArray(children);

    const footer = childrenArray.find((child) => React.isValidElement(child) && child.type === ModalActions);

    const enhancedFooter = React.isValidElement<{ children: React.ReactNode }>(footer)
        ? React.cloneElement(footer, {
              children: React.Children.map(footer.props.children, (child, index) => {
                  if (index === 0 && React.isValidElement(child)) {
                      return React.cloneElement(child as React.ReactElement<any>, {
                          ref: focusRef,
                      });
                  }
                  return child;
              }),
          })
        : null;

    return (
        <>
            {isDesktop && (
                <div
                    className={clsx(
                        'fixed inset-0 z-[99999] flex items-center justify-center duration-300',
                        active ? 'bg-black/50 backdrop-blur-sm' : 'pointer-events-none bg-transparent',
                    )}
                    onClick={onClickOutside}
                >
                    <div
                        className={clsx(
                            'flex max-h-[min(800px,_80vh)] w-[540px] flex-col overflow-y-auto rounded-xl bg-white font-sans text-gray-900 shadow-xl duration-300 dark:bg-gray-900 dark:text-gray-100',
                            active ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0',
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {React.Children.map(children, (child) =>
                            (child as React.ReactElement)?.type === ModalBody
                                ? React.cloneElement(child as React.ReactElement<ModalBodyProps>, { sticky })
                                : (child as React.ReactElement)?.type === ModalActions && !initialFocusRef
                                  ? enhancedFooter
                                  : child,
                        )}
                    </div>
                </div>
            )}
            {isMobile && (
                <div
                    className={clsx(
                        'fixed inset-0 z-[99999] flex items-end justify-center duration-300',
                        active ? 'bg-black/50 backdrop-blur-sm' : 'pointer-events-none bg-transparent',
                    )}
                    onClick={onClickOutside}
                >
                    <div
                        className={clsx(
                            'flex max-h-[80vh] w-full flex-col overflow-y-auto rounded-t-xl bg-white font-sans text-gray-900 shadow-xl duration-300 dark:bg-gray-900 dark:text-gray-100',
                            active ? 'translate-y-0' : 'translate-y-full',
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {React.Children.map(children, (child) =>
                            (child as React.ReactElement)?.type === ModalBody
                                ? React.cloneElement(child as React.ReactElement<ModalBodyProps>, { sticky })
                                : child,
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

const ModalBody = ({ children, sticky, className }: ModalBodyProps) => (
    <div className={clsx('overflow-y-auto text-sm', sticky ? 'px-6 pb-6' : 'p-6', className)}>
        {React.Children.map(children, (child) =>
            (child as React.ReactElement)?.type === ModalHeader
                ? React.cloneElement(child as React.ReactElement<ModalHeaderProps>, { sticky })
                : child,
        )}
    </div>
);

const ModalHeader = ({ children, sticky }: ModalHeaderProps) => (
    <header
        className={clsx(
            'mb-6 rounded-t-xl',
            sticky && 'sticky top-0 -mx-6 border-b border-gray-200 bg-white px-6 pt-5 dark:border-gray-700 dark:bg-gray-900',
        )}
    >
        {children}
    </header>
);

const ModalInset = ({ children }: { children: React.ReactNode }) => (
    <div className="-mx-6 border-t border-b border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">{children}</div>
);

const ModalTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="mb-2 text-2xl font-semibold tracking-[-0.029375rem]">{children}</h2>
);

const ModalSubtitle = ({ children }: { children: React.ReactNode }) => <p className="text-base text-gray-600 dark:text-gray-400">{children}</p>;

const ModalActions = ({ children }: { children: React.ReactNode }) => (
    <footer className="sticky inset-0 bottom-0 flex shrink-0 justify-between rounded-b-xl border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        {children}
    </footer>
);

const ModalAction = (props: ButtonProps) => <Button {...props}>{props.children}</Button>;

export const Modal = {
    Modal: ModalModal,
    Header: ModalHeader,
    Inset: ModalInset,
    Body: ModalBody,
    Title: ModalTitle,
    Subtitle: ModalSubtitle,
    Actions: ModalActions,
    Action: ModalAction,
};
