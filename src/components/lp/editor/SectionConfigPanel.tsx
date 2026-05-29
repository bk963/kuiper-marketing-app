'use client';
/**
 * SectionConfigPanel — mittlere Spalte im Editor.
 *
 * Rendert pro Section-Type ein spezifisches Form-Layout das die Config-Felder
 * der Section editierbar macht. Jedes Form patcht config-Felder via onConfigChange.
 *
 * Zusätzlich: ID-Editor (für friendly Anker-Links).
 */
import type { BshSection, BshSectionType } from '../sections/types';
import { TextInput, TextareaInput, StringListInput, ObjectListInput } from './inputs';

export default function SectionConfigPanel({
  section,
  onConfigChange,
  onTypeRename,
}: {
  section: BshSection | null;
  onConfigChange: (patch: any) => void;
  onTypeRename: (newId: string) => void;
}) {
  if (!section) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500 text-sm">
        Wähle eine Section links aus, um sie zu bearbeiten.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 border-b bg-slate-50 flex items-center gap-3">
        <span className="text-xs font-mono px-2 py-1 rounded bg-brand/10 text-brand-dark font-bold">
          {section.type}
        </span>
        <input
          type="text"
          value={section.id}
          onChange={e => onTypeRename(e.target.value)}
          className="flex-1 px-2 py-1 text-xs font-mono border border-slate-200 rounded focus:outline-none focus:border-brand"
          title="Section-ID (für Anker-Links)"
        />
      </div>

      <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        <ConfigForm type={section.type} config={section.config} onChange={onConfigChange} />
      </div>
    </div>
  );
}

function ConfigForm({ type, config, onChange }: { type: BshSectionType; config: any; onChange: (p: any) => void }) {
  const set = (key: string) => (v: any) => onChange({ [key]: v });

  switch (type) {
    case 'bsh-hero':
      return (
        <>
          <TextInput label="Eyebrow" value={config.eyebrow} onChange={set('eyebrow')} placeholder="★ ..." />
          <TextInput label="Headline-Anfang" value={config.headlinePre} onChange={set('headlinePre')} />
          <TextInput label="Headline-Accent (cyan)" value={config.headlineAccent} onChange={set('headlineAccent')} />
          <TextareaInput label="Subline" value={config.subline} onChange={set('subline')} />
          <hr className="my-4" />
          <TextInput label="Video-Source" value={config.videoSrc} onChange={set('videoSrc')} placeholder="/videos/.../hero.mp4" />
          <TextInput label="Video-Poster" value={config.videoPoster} onChange={set('videoPoster')} />
          <TextInput label="Video-Caption" value={config.videoCaption} onChange={set('videoCaption')} />
          <hr className="my-4" />
          <TextInput label="Form-Title" value={config.formTitle} onChange={set('formTitle')} />
          <TextInput label="Form-ID (Tracking)" value={config.formId} onChange={set('formId')} placeholder="bsh-hero" />
          <TextInput label="Lead-Source-Slug" value={config.leadSource} onChange={set('leadSource')} placeholder="bsh-lp" />
          <hr className="my-4" />
          <TextInput label="TÜV-Logo-URL" value={config.tuevLogo} onChange={set('tuevLogo')} />
          <TextInput label="TÜV-Title" value={config.tuevTitle} onChange={set('tuevTitle')} />
          <TextareaInput label="TÜV-Body" value={config.tuevBody} onChange={set('tuevBody')} rows={4} />
        </>
      );

    case 'bsh-usps':
      return (
        <>
          <TextInput label="Eyebrow" value={config.eyebrow} onChange={set('eyebrow')} />
          <TextInput label="Headline" value={config.headline} onChange={set('headline')} />
          <ObjectListInput
            label="USP-Cards"
            hint="FontAwesome-Klasse als Icon (z.B. fas fa-laptop)"
            values={config.cards || []}
            onChange={set('cards')}
            newItem={() => ({ icon: 'fas fa-check', title: 'Neuer Vorteil', body: '' })}
            itemLabel={(c: any) => c.title || '(ohne Titel)'}
            renderItem={(c: any, patch) => (
              <>
                <TextInput label="Icon-Klasse" value={c.icon} onChange={v => patch({ icon: v })} placeholder="fas fa-file-signature" />
                <TextInput label="Title" value={c.title} onChange={v => patch({ title: v })} />
                <TextareaInput label="Body" value={c.body} onChange={v => patch({ body: v })} rows={2} />
              </>
            )}
          />
        </>
      );

    case 'bsh-story':
      return (
        <>
          <TextInput label="Headline-Anfang" value={config.headlinePre} onChange={set('headlinePre')} />
          <TextInput label="Headline-Accent (cyan)" value={config.headlineAccent} onChange={set('headlineAccent')} />
          <TextInput label="Headline-Suffix" value={config.headlineSuffix} onChange={set('headlineSuffix')} />
          <StringListInput
            label="Paragraphen (HTML erlaubt: <strong>, <em>)"
            hint="Jede Zeile ein Absatz."
            values={config.paragraphs || []}
            onChange={set('paragraphs')}
            placeholder="Möchten Sie für den Ernstfall..."
          />
          <TextInput label="Foto-URL" value={config.photoSrc} onChange={set('photoSrc')} />
          <TextInput label="Foto-Alt-Text" value={config.photoAlt} onChange={set('photoAlt')} />
        </>
      );

    case 'bsh-member':
      return (
        <>
          <TextInput label="Label" value={config.label} onChange={set('label')} />
          <ObjectListInput
            label="Logos"
            values={config.logos || []}
            onChange={set('logos')}
            newItem={() => ({ src: '', alt: '' })}
            itemLabel={(l: any) => l.alt || '(ohne Alt)'}
            renderItem={(l: any, patch) => (
              <>
                <TextInput label="Logo-URL" value={l.src} onChange={v => patch({ src: v })} />
                <TextInput label="Alt-Text" value={l.alt} onChange={v => patch({ alt: v })} />
              </>
            )}
          />
        </>
      );

    case 'bsh-testi':
      return (
        <>
          <TextInput label="Eyebrow" value={config.eyebrow} onChange={set('eyebrow')} />
          <TextInput label="Headline" value={config.headline} onChange={set('headline')} />
          <ObjectListInput
            label="Videos"
            values={config.videos || []}
            onChange={set('videos')}
            newItem={() => ({ src: '', poster: '' })}
            itemLabel={(_v: any, i: number) => `Testimonial-Video ${i + 1}`}
            renderItem={(v: any, patch) => (
              <>
                <TextInput label="Video-Source" value={v.src} onChange={vv => patch({ src: vv })} placeholder="/videos/.../t1.mp4" />
                <TextInput label="Poster-URL" value={v.poster} onChange={vv => patch({ poster: vv })} />
              </>
            )}
          />
        </>
      );

    case 'bsh-pe':
      return (
        <>
          <TextInput label="Label" value={config.label} onChange={set('label')} />
          <TextInput label="Widget-Script-URL" value={config.widgetSrc} onChange={set('widgetSrc')} placeholder="https://www.provenexpert.com/widget/..." />
        </>
      );

    case 'bsh-steps':
      return (
        <>
          <TextInput label="Eyebrow" value={config.eyebrow} onChange={set('eyebrow')} />
          <TextInput label="Headline-Anfang" value={config.headlinePre} onChange={set('headlinePre')} />
          <TextInput label="Headline-Accent (cyan)" value={config.headlineAccent} onChange={set('headlineAccent')} />
          <TextInput label="Headline-Suffix" value={config.headlineSuffix} onChange={set('headlineSuffix')} placeholder="." />
          <ObjectListInput
            label="Schritte"
            values={config.steps || []}
            onChange={set('steps')}
            newItem={() => ({ num: '01', title: '', body: '' })}
            itemLabel={(s: any) => `${s.num} ${s.title}`}
            renderItem={(s: any, patch) => (
              <>
                <TextInput label="Nummer" value={s.num} onChange={v => patch({ num: v })} />
                <TextInput label="Titel" value={s.title} onChange={v => patch({ title: v })} />
                <TextareaInput label="Body" value={s.body} onChange={v => patch({ body: v })} rows={3} />
              </>
            )}
          />
          <hr className="my-4" />
          <TextInput label="CTA-Text" value={config.ctaText} onChange={set('ctaText')} />
          <TextInput label="CTA-Link" value={config.ctaHref} onChange={set('ctaHref')} placeholder="#anfrage" />
        </>
      );

    case 'bsh-content':
      return (
        <>
          <TextInput label="Headline" value={config.headline} onChange={set('headline')} />
          <StringListInput
            label="Check-Bullets"
            values={config.items || []}
            onChange={set('items')}
            placeholder="Grundzüge des Brandschutzes"
          />
        </>
      );

    case 'bsh-hybrid':
      return (
        <>
          <TextInput label="Eyebrow" value={config.eyebrow} onChange={set('eyebrow')} />
          <TextInput label="Headline-Anfang" value={config.headlinePre} onChange={set('headlinePre')} />
          <TextInput label="Headline-Accent (cyan)" value={config.headlineAccent} onChange={set('headlineAccent')} />
          <TextInput label="Headline-Suffix" value={config.headlineSuffix} onChange={set('headlineSuffix')} />
          <StringListInput
            label="Paragraphen (HTML erlaubt)"
            values={config.paragraphs || []}
            onChange={set('paragraphs')}
          />
          <TextInput label="Note (fett+cyan)" value={config.note} onChange={set('note')} />
        </>
      );

    case 'bsh-team':
      return (
        <>
          <TextInput label="Eyebrow" value={config.eyebrow} onChange={set('eyebrow')} />
          <TextInput label="Headline" value={config.headline} onChange={set('headline')} />
          <ObjectListInput
            label="Team-Mitglieder"
            values={config.people || []}
            onChange={set('people')}
            newItem={() => ({ name: '', role: '', photo: '', quals: [] })}
            itemLabel={(p: any) => p.name || '(neu)'}
            renderItem={(p: any, patch) => (
              <>
                <TextInput label="Name" value={p.name} onChange={v => patch({ name: v })} />
                <TextInput label="Rolle" value={p.role} onChange={v => patch({ role: v })} />
                <TextInput label="Foto-URL" value={p.photo} onChange={v => patch({ photo: v })} />
                <StringListInput
                  label="Qualifikationen"
                  values={p.quals || []}
                  onChange={v => patch({ quals: v })}
                />
              </>
            )}
          />
          <TextInput label="Stand-Datum (Footnote)" value={config.standDate} onChange={set('standDate')} placeholder="Stand: 16.01.2026" />
        </>
      );

    case 'bsh-loc':
      return (
        <>
          <TextInput label="Eyebrow" value={config.eyebrow} onChange={set('eyebrow')} />
          <TextInput label="Big Zeile 1" value={config.bigPart1} onChange={set('bigPart1')} placeholder="Voerde" />
          <TextInput label="Big Zeile 2 (cyan)" value={config.bigPart2} onChange={set('bigPart2')} placeholder="Niederrhein." />
          <TextareaInput label="Body" value={config.body} onChange={set('body')} />
          <TextInput label="Maps-URL" value={config.mapsUrl} onChange={set('mapsUrl')} type="url" />
          <TextInput label="Maps-Text" value={config.mapsText} onChange={set('mapsText')} />
        </>
      );

    case 'bsh-faq':
      return (
        <>
          <TextInput label="Eyebrow" value={config.eyebrow} onChange={set('eyebrow')} />
          <TextInput label="Headline-Anfang" value={config.headlinePre} onChange={set('headlinePre')} />
          <TextInput label="Headline-Accent (cyan)" value={config.headlineAccent} onChange={set('headlineAccent')} />
          <TextInput label="Headline-Suffix" value={config.headlineSuffix} onChange={set('headlineSuffix')} placeholder="?" />
          <ObjectListInput
            label="FAQ-Einträge"
            values={config.items || []}
            onChange={set('items')}
            newItem={() => ({ q: '', a: '' })}
            itemLabel={(it: any) => it.q || '(Frage)'}
            renderItem={(it: any, patch) => (
              <>
                <TextareaInput label="Frage" value={it.q} onChange={v => patch({ q: v })} rows={2} />
                <TextareaInput label="Antwort" value={it.a} onChange={v => patch({ a: v })} rows={3} />
              </>
            )}
          />
        </>
      );

    case 'bsh-final':
      return (
        <>
          <TextInput label="Eyebrow" value={config.eyebrow} onChange={set('eyebrow')} />
          <TextInput label="Headline-Anfang" value={config.headlinePre} onChange={set('headlinePre')} />
          <TextInput label="Headline-Accent (cyan)" value={config.headlineAccent} onChange={set('headlineAccent')} />
          <TextInput label="Headline-Suffix" value={config.headlineSuffix} onChange={set('headlineSuffix')} placeholder="." />
          <StringListInput
            label="Check-Bullets"
            values={config.bullets || []}
            onChange={set('bullets')}
          />
          <TextInput label="CTA-Text" value={config.ctaText} onChange={set('ctaText')} />
          <TextInput label="CTA-Link" value={config.ctaHref} onChange={set('ctaHref')} placeholder="#anfrage" />
        </>
      );

    case 'bsh-open':
      return (
        <>
          <TextInput label="Eyebrow" value={config.eyebrow} onChange={set('eyebrow')} />
          <TextInput label="Headline" value={config.headline} onChange={set('headline')} />
          <TextareaInput label="Body" value={config.body} onChange={set('body')} rows={4} />
        </>
      );

    default:
      return (
        <div className="text-sm text-slate-500">
          Section-Type <code>{type}</code> hat noch kein Config-Form.
        </div>
      );
  }
}
