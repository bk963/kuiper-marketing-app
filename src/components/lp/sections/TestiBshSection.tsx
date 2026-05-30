/**
 * BSH-Testimonials-Section — kf-bsh-testi
 * Pos 5 in der Default-BSH-LP. Video-Testimonials in 2-Spalten-Grid.
 *
 * Phase 1b: eyebrow + headline via EditableText.
 * Phase 1c: videos[] mit ItemToolbar (src/poster bleiben — Settings-Sidebar Phase 7).
 */
import { Video } from './_helpers';
import { EditableText } from '../editor/EditableText';
import ItemToolbar, { AddItemButton } from '../editor/ItemToolbar';
import { TESTI_VIDEO_DEFAULT } from '../editor/itemDefaults';

export type TestiBshConfig = {
  eyebrow?: string;
  headline: string;
  videos: { src: string; poster?: string }[];
};

export default function TestiBshSection({ config }: { config: TestiBshConfig }) {
  return (
    <section className="kf-bsh-testi">
      <div className="kf-bsh-testi__inner">
        {config.eyebrow && (
          <EditableText as="p" fieldKey="eyebrow" className="kf-bsh-testi__eyebrow">
            {config.eyebrow}
          </EditableText>
        )}
        <EditableText as="h2" fieldKey="headline" className="kf-bsh-testi__headline">
          {config.headline}
        </EditableText>
        <div className="kf-bsh-testi__grid">
          {config.videos.map((v, i) => (
            <div key={i} data-edit-item-container>
              <ItemToolbar arrayKey="videos" index={i} total={config.videos.length} template={TESTI_VIDEO_DEFAULT} hideDuplicate />
              <Video videoId={`testi-${i + 1}`} src={v.src} poster={v.poster} />
            </div>
          ))}
        </div>
        <AddItemButton arrayKey="videos" template={TESTI_VIDEO_DEFAULT} label="+ Neues Testimonial-Video" />
      </div>
    </section>
  );
}
