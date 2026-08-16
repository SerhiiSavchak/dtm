import { Fragment, type ReactNode } from "react";

const NBSP = "\u00A0";

/**
 * Keep an em dash attached to both neighbouring words via a short nowrap
 * span and NBSP. Does not wrap the whole paragraph.
 */
export function CopyText({ children }: { children: string }) {
  const nodes: ReactNode[] = [];
  const re = /(\S+)\s+[—–]\s+(\S+)/g;
  let last = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(children))) {
    if (match.index > last) {
      nodes.push(
        <Fragment key={`t${key}`}>{children.slice(last, match.index)}</Fragment>
      );
    }
    nodes.push(
      <span key={`d${key}`} className="u-nowrap">
        {`${match[1]}${NBSP}—${NBSP}${match[2]}`}
      </span>
    );
    key += 1;
    last = match.index + match[0].length;
  }

  if (last < children.length) {
    nodes.push(<Fragment key={`t${key}`}>{children.slice(last)}</Fragment>);
  }

  return nodes;
}
