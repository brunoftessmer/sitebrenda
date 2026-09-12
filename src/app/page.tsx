import NumberGrid from "@/components/NumberGrid";
import BrendaPhoto from "@/components/BrendaPhoto";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <section className="px-4 pt-8 pb-6 text-center">
        <BrendaPhoto />
        <h1 className="text-2xl font-semibold text-rose-800">
          Chá de casa nova da Brenda 🏡
        </h1>
        <p className="mx-auto mt-3 max-w-md text-stone-600">
          Os papis da Brenda finalmente podem suspirar aliviados. 😂 A nossa
          caçula alçou voo e foi conquistar Criciúma! Ela garantiu um estágio
          incrível por lá e agora está descobrindo os mistérios de morar
          sozinha. Para dar aquela força nessa fase que é, convenhamos, um
          momento único na vida (e que precisa de um empurrãozinho
          financeiro!), criamos uma rifa super especial! Quem quer concorrer
          a uma linda cesta de café da manhã e ainda ajudar a Brenda a não
          passar aperto? Corre pra participar!
        </p>
        <p className="mx-auto mt-3 max-w-md text-stone-600">
          Escolha um ou mais números abaixo — cada um custa R$ 25 — e ajude a
          Brenda a dar os próximos passos nesse novo lar. Obrigada por fazer
          parte dessa fase com ela! 💛
        </p>
        <p className="mx-auto mt-4 inline-block rounded-full bg-rose-100 px-4 py-1.5 text-sm font-medium text-rose-700">
          🎉 Sorteio dia 12/10/2026
        </p>
      </section>

      <NumberGrid />
    </div>
  );
}
