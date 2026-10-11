import { PageHeader, type PageHeaderProps } from './page-header';

/** Admin listings use the same header and sticky actions as record pages. */
export function IndexHeader(props: PageHeaderProps) {
    return <PageHeader {...props} className={props.className} />;
}
