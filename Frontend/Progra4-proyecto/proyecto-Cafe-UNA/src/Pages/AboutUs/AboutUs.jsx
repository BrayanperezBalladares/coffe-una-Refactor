import Gallery from '../../Components/Gallery/Gallery';
import { AboutNarrativeBlock } from '../../Components/AboutNarrativeBlock/AboutNarrativeBlock';
import BackToHomeLink from '../../Components/BackToHomeLink/BackToHomeLink';
import { HOME_SCROLL_SECTIONS } from '../../lib/homeScrollTarget';
import { PublicPageGate } from '../../Components/PublicPageGate/PublicPageGate';
import { useCachedPublicPage } from '../../hooks/useCachedPublicPage';
import { fetchAboutPageData } from '../../lib/aboutPageData';
import { useRouterState } from '@tanstack/react-router';
import { useTraducir } from '../../hooks/useTraducir';
import { ST } from '../../Components/T/ST';
import { Sparkles, GraduationCap, Coffee } from 'lucide-react';
import './AboutUs.css';

const AboutUs = () => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const esGaleria = String(pathname || '').toLowerCase().includes('/galeria');

  const {
    data,
    showLoading,
    isError,
    error: loadError,
    reload,
    loadingMessage,
  } = useCachedPublicPage('about', fetchAboutPageData);

  const tGaleriaCarga = useTraducir('Cargando galería...');
  const tGaleria = useTraducir('Galería');
  const tHistoria = useTraducir('Historia');
  const tSinFotos = useTraducir('Todavía no hay fotos en la galería.');
  const mensajeCarga = esGaleria ? tGaleriaCarga : loadingMessage;

  const historiaTitulo = data?.historiaTitulo ?? '';
  const historia = data?.historia ?? '';
  const missionData = data?.missionData ?? { title: '', description: '' };
  const visionData = data?.visionData ?? { title: '', description: '' };
  const galleryItems = data?.galleryData ?? [];

  const hasHistoria = Boolean(historiaTitulo || historia || data?.historiaImage || data?.historiaEyebrow);
  const hasMission = Boolean(missionData.title || missionData.description || missionData.image || missionData.eyebrow);
  const hasVision = Boolean(visionData.title || visionData.description || visionData.image || visionData.eyebrow);
  const hasGallery = galleryItems.length > 0;

  return (
    <PublicPageGate
      showLoading={showLoading}
      loadingMessage={mensajeCarga}
      isError={isError}
      error={loadError}
      errorMessage={"No se pudo cargar la informaci\u00f3n de Sobre Nosotros."}
      onRetry={reload}
    >
      <main className="about-page site-canvas">
        <BackToHomeLink homeSection={HOME_SCROLL_SECTIONS.about} />

        {esGaleria ? (
          <>
            <header className="about-page__hero">
              <div className="about-page__hero-badge">
                <Sparkles size={14} className="about-page__hero-badge-icon" aria-hidden="true" />
                <span><ST>Registro Visual</ST></span>
              </div>
              <h1 className="about-page__hero-title">
                <ST>{tGaleria}</ST>
              </h1>
              <p className="about-page__hero-lead">
                <ST>
                  Un recorrido fotográfico por nuestros cafetales, procesos de catación y las
                  actividades académicas que impulsan nuestra comunidad.
                </ST>
              </p>
              <div className="about-page__hero-divider" aria-hidden="true" />
            </header>
            {hasGallery ? (
              <Gallery items={galleryItems} pageSize={10} title="" />
            ) : (
              <p className="about-page__block-lead">{tSinFotos}</p>
            )}
          </>
        ) : (
          <>
            <header className="about-page__hero">
              <div className="about-page__hero-badge">
                <Sparkles size={14} className="about-page__hero-badge-icon" aria-hidden="true" />
                <span><ST>Nuestra Esencia & Tradición</ST></span>
              </div>
              <h1 className="about-page__hero-title">
                <ST>Pasión por el café, compromiso con nuestra comunidad</ST>
              </h1>
              <p className="about-page__hero-lead">
                <ST>
                  Conocé la historia, el propósito y la visión de Café UNA, un proyecto de la
                  Escuela de Ciencias Agrarias que fusiona la excelencia del café costarricense con
                  la docencia, la investigación y el desarrollo sostenible.
                </ST>
              </p>
              <div className="about-page__hero-divider" aria-hidden="true" />
            </header>

            <section
              id="about-historia"
              className="about-page__block about-page__block--historia"
              aria-label={tHistoria}
            >
              <div className="about-page__narratives">
                {hasHistoria ? (
                  <AboutNarrativeBlock
                    eyebrow={data?.historiaEyebrow}
                    defaultEyebrow="Tradición & Origen"
                    title={historiaTitulo}
                    description={historia}
                    image={data?.historiaImage}
                    badgeLabel="Escuela de Ciencias Agrarias"
                    badgeIcon={<GraduationCap size={14} className="about-narrative__chip-icon" aria-hidden="true" />}
                    highlights={[
                      'Vínculo directo con la Escuela de Ciencias Agrarias',
                      'Café de especialidad con trazabilidad y origen',
                      'Producción ética y apoyo a la investigación',
                    ]}
                  />
                ) : null}
                {hasMission ? (
                  <AboutNarrativeBlock
                    eyebrow={missionData.eyebrow}
                    defaultEyebrow="Propósito Institucional"
                    title={missionData.title}
                    description={missionData.description}
                    image={missionData.image}
                    reverse
                    badgeLabel="Docencia & Calidad"
                    badgeIcon={<Coffee size={14} className="about-narrative__chip-icon" aria-hidden="true" />}
                    highlights={[
                      'Formación académica y científica en caficultura',
                      'Promoción de prácticas agrícolas regenerativas',
                      'Generación de valor para la comunidad universitaria',
                    ]}
                  />
                ) : null}
                {hasVision ? (
                  <AboutNarrativeBlock
                    eyebrow={visionData.eyebrow}
                    defaultEyebrow="Horizonte & Futuro"
                    title={visionData.title}
                    description={visionData.description}
                    image={visionData.image}
                    badgeLabel="Innovación 2030"
                    badgeIcon={<Sparkles size={14} className="about-narrative__chip-icon" aria-hidden="true" />}
                    highlights={[
                      'Referente universitario en café sostenible',
                      'Innovación continua en procesos de beneficiado',
                      'Impacto positivo en el desarrollo rural costarricense',
                    ]}
                  />
                ) : null}
              </div>
            </section>
          </>
        )}
      </main>
    </PublicPageGate>
  );
};

export default AboutUs;
