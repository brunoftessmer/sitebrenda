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
          Acabei de me mudar e ficaria muito feliz em contar com o carinho de
          vocês para montar minha casa nova! Escolha um ou mais números abaixo
          — cada um custa R$ 25 — e me ajude a dar os próximos passos nesse
          novo lar. Obrigada por fazer parte dessa fase comigo! 💛
        </p>
      </section>

      <NumberGrid />
    </div>
  );
}
