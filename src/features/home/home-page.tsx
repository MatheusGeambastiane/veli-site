import Link from "next/link";
import Image from "next/image";
import {
  ArrowDownRight,
  ArrowRight,
  AudioLines,
  BookOpen,
  MoveUpRight,
  Plane,
  Plus,
} from "lucide-react";
import { homeFaqs, homeLanguages, homeSteps } from "./home-content";

function HomeActions() {
  return (
    <div className="v-actions">
      <Link className="v-button v-button-primary" href="/checkout">
        Quero me matricular <ArrowUpIcon />
      </Link>
      <Link className="v-button v-button-secondary" href="/teste-de-nivel">
        Descobrir meu nível <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </div>
  );
}

function ArrowUpIcon() {
  return <MoveUpRight size={18} aria-hidden="true" />;
}

export function HomePage() {
  return (
    <>
      <section className="v-hero" aria-labelledby="home-title">
        <div className="v-cloud v-cloud-left" aria-hidden="true" />
        <div className="v-cloud v-cloud-right" aria-hidden="true" />
        <div className="v-container v-hero-inner">
          <p className="v-eyebrow v-launch">
            Primeira turma <span aria-hidden="true">/</span> Janeiro de 2027
          </p>
          <div className="v-hero-heading">
            <span className="v-star v-star-one" aria-hidden="true">
              ✦
            </span>
            <h1 id="home-title" lang="en">
              <span className="v-speak">Speak</span>
              <span className="v-script v-beyond" lang="en">
                beyond borders
              </span>
            </h1>
            <span className="v-star v-star-two" aria-hidden="true">
              ✦
            </span>
            <div className="v-flight" aria-hidden="true">
              <Plane size={32} />
              <span />
            </div>
          </div>
          <p className="v-hero-description">
            Aprenda inglês e francês com aulas gravadas e encontros semanais ao
            vivo. Prepare-se no seu ritmo e ganhe confiança para conversar.
          </p>
          <HomeActions />
          <div className="v-hero-note">
            <AudioLines size={19} aria-hidden="true" />
            <span>Menos receio de falar. Mais espaço para ser você.</span>
          </div>
        </div>
        <div className="v-postal-edge" aria-hidden="true" />
      </section>

      <section
        className="v-section v-languages"
        id="idiomas"
        aria-labelledby="languages-title"
      >
        <div className="v-container">
          <div className="v-section-intro">
            <div>
              <p className="v-eyebrow">Duas línguas, muitos caminhos</p>
              <h2 id="languages-title">
                Qual idioma vai fazer
                <br className="v-desktop-break" /> parte da sua vida?
              </h2>
            </div>
            <p>
              Para quem vai dar o primeiro passo.
              <br />E para quem quer ir um pouco além.
            </p>
          </div>
          <div className="v-language-grid">
            {homeLanguages.map((language) => (
              <article
                key={language.name}
                className={`v-language ${language.className}`}
              >
                <div className="v-language-top">
                  <h3>
                    <Image
                      className="v-language-flag"
                      src={language.flag}
                      alt=""
                      width={28}
                      height={28}
                    />
                    {language.name}
                  </h3>
                  <span className="v-language-icon" aria-hidden="true">
                    <MoveUpRight size={25} />
                  </span>
                </div>
                <div className="v-language-postcard">
                  <p
                    className="v-greeting"
                    lang={language.name === "Inglês" ? "en" : "fr"}
                  >
                    {language.greeting}
                  </p>
                  <span className="v-landmark" aria-hidden="true" />
                </div>
                <h4>{language.caption}</h4>
                <p>{language.description}</p>
                <Link href="/checkout" className="v-text-link">
                  Quero aprender {language.name.toLowerCase()}{" "}
                  <ArrowRight size={19} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="v-section v-method"
        id="como-funciona"
        aria-labelledby="method-title"
      >
        <div className="v-container v-method-grid">
          <div className="v-method-heading">
            <p className="v-eyebrow">O seu jeito de aprender importa</p>
            <h2 id="method-title">
              Você no centro.
              <br />A conversa em
              <br />
              <span className="v-script">movimento.</span>
            </h2>
            <p>
              A sala de aula invertida muda a ordem das coisas: você explora
              antes e aproveita o encontro para colocar o idioma em prática.
            </p>
            <div className="v-method-stamp">
              <BookOpen size={22} aria-hidden="true" />
              <span>
                Aprender também
                <br />é participar.
              </span>
              <span className="v-passport-stamp" aria-hidden="true">
                <span>VELI</span>
                <Plane size={18} />
                <span>EMBARQUE</span>
              </span>
            </div>
          </div>
          <ol className="v-steps">
            {homeSteps.map((step, index) => (
              <li key={step.title}>
                <span className="v-step-number" aria-hidden="true">
                  0{index + 1}
                </span>
                <div>
                  <p className="v-eyebrow">{step.label}</p>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        className="v-section v-lara"
        id="lara"
        aria-labelledby="lara-title"
      >
        <div className="v-container v-lara-grid">
          <div className="v-portrait">
            <Image
              src="/lara_canro_imagem.jpg"
              alt="Lara Canro, fundadora e professora da Veli"
              fill
              sizes="(max-width: 767px) 150px, (max-width: 1023px) 210px, 250px"
              className="v-portrait-image"
            />
          </div>
          <div>
            <p className="v-eyebrow">Conheça a Lara</p>
            <h2 id="lara-title">
              Uma escola criada por
              <br className="v-desktop-break" /> quem vive os idiomas.
            </h2>
            <p className="v-lara-description">
              Lara Canro é fundadora e professora da Veli. Sua proposta é
              aproximar o inglês e o francês da vida real: das músicas que você
              ouve, das culturas que descobre e das conversas que quer ter.
            </p>
            <p className="v-lara-signature">
              Um espaço para aprender, tentar e se expressar.
              <br />
              <strong>Com você no centro de tudo.</strong>
            </p>
            <a
              href="https://www.instagram.com/laracanro/"
              target="_blank"
              rel="noreferrer"
              className="v-text-link"
            >
              Conheça a Lara no Instagram{" "}
              <MoveUpRight size={18} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section
        className="v-section v-faq"
        id="duvidas"
        aria-labelledby="faq-title"
      >
        <div className="v-container v-faq-grid">
          <div>
            <p className="v-eyebrow">Vamos conversar?</p>
            <h2 id="faq-title">
              Ficou alguma
              <br />
              dúvida?
            </h2>
            <p>
              A gente ajuda você
              <br />a dar o próximo passo.
            </p>
            <ArrowDownRight size={48} strokeWidth={1.2} aria-hidden="true" />
          </div>
          <div className="v-faq-list">
            {homeFaqs.map((faq) => (
              <details key={faq.question}>
                <summary>
                  {faq.question}
                  <Plus size={20} aria-hidden="true" />
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="v-final" aria-labelledby="final-title">
        <div className="v-container">
          <p className="v-eyebrow">Inglês e francês · Janeiro de 2027</p>
          <h2 id="final-title">
            Sua próxima conversa
            <br />
            começa aqui
            <span className="v-final-star" aria-hidden="true">
              ✦
            </span>
          </h2>
          <HomeActions />
        </div>
      </section>
    </>
  );
}
