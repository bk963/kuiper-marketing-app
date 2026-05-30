'use client';
/**
 * ParagraphRenderer — Bridge für Story + Hybrid Paragraphs.
 *
 * In Apex-LP (kein EditableContext.Provider) → rendert <RichText> mit dangerouslySetInnerHTML
 * (HTML-Tags wie <strong> bleiben erhalten).
 *
 * In Inline-Editor (EditableContext.Provider editable=true) → rendert <EditableText>
 * mit plain-text (HTML wird strip-displayed). Inline-Bold-Formatting kommt in Phase 1d.
 *
 * Eigene Client-Component weil useContext nur in Client-Components geht.
 * Die Eltern-Section (Story/Hybrid) bleibt Server-Component für SSR/SEO.
 */
import { useContext } from 'react';
import { EditableContext, EditableText } from '../editor/EditableText';
import { RichText } from './_helpers';

export default function ParagraphRenderer({
  html,
  arrayKey,
  index,
}: {
  html: string;
  arrayKey: string;
  index: number;
}) {
  const ctx = useContext(EditableContext);
  if (ctx?.editable) {
    return (
      <EditableText as="p" fieldKey={`${arrayKey}.${index}`}>
        {html.replace(/<\/?[^>]+(>|$)/g, '')}
      </EditableText>
    );
  }
  return <RichText html={html} as="p" />;
}
