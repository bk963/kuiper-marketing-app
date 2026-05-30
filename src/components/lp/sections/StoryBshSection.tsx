/**
 * BSH-Story-Section — kf-bsh-story
 * Pos 3 in der Default-BSH-LP.
 * Text-Block links + Portrait-Foto rechts auf Navy-Hintergrund mit Cyan-Akzent.
 *
 * Phase 1b: flat headline-Parts via EditableText.
 * Phase 1c: paragraphs[] via EditableText path + ItemToolbar.
 *   Note: RichText (mit <strong>-HTML) wird durch plain-EditableText ersetzt im
 *   Edit-Mode. Inline-Bold-Formatting kommt in Phase 1d / Settings-Sidebar.
 */
import { EditableText } from '../editor/EditableText';
import ItemToolbar, { AddItemButton } from '../editor/ItemToolbar';
import { PARAGRAPH_DEFAULT } from '../editor/itemDefaults';
import ParagraphRenderer from './_ParagraphRenderer';

export type StoryBshConfig = {
  headlinePre: string;
  headlineAccent: string;
  headlineSuffix?: string;
  /** Paragraphen können <strong>-HTML enthalten */
  paragraphs: string[];
  photoSrc?: string;
  photoAlt?: string;
};

export default function StoryBshSection({ config }: { config: StoryBshConfig }) {
  return (
    <section className="kf-bsh-story">
      <div className="kf-bsh-story__inner">
        <div className="kf-bsh-story__text">
          <h2 className="kf-bsh-story__headline">
            <EditableText as="span" fieldKey="headlinePre">{config.headlinePre}</EditableText>{' '}
            <EditableText as="span" fieldKey="headlineAccent" className="kf-bsh-story__accent">
              {config.headlineAccent}
            </EditableText>
            {config.headlineSuffix && (
              <>
                {' '}
                <EditableText as="span" fieldKey="headlineSuffix">{config.headlineSuffix}</EditableText>
              </>
            )}
          </h2>
          <div className="kf-bsh-story__body">
            {config.paragraphs.map((p, i) => (
              <div key={i} data-edit-item-container>
                <ItemToolbar arrayKey="paragraphs" index={i} total={config.paragraphs.length} template={PARAGRAPH_DEFAULT} />
                <ParagraphRenderer html={p} arrayKey="paragraphs" index={i} />
              </div>
            ))}
            <AddItemButton arrayKey="paragraphs" template={PARAGRAPH_DEFAULT} label="+ Neuer Absatz" />
          </div>
        </div>
        {config.photoSrc && (
          <div className="kf-bsh-story__photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={config.photoSrc} alt={config.photoAlt || ''} width={947} height={738} loading="lazy" />
          </div>
        )}
      </div>
    </section>
  );
}
