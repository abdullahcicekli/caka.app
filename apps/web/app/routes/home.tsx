import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Caka — bio linkin, kendi mini siten" },
    {
      name: "description",
      content:
        "Sürükle-bırak grid ile profil sayfanı kur, yayınla, paylaş. Tek linkle her şeyin tek ekranda.",
    },
  ];
}

export default function Home() {
  return <Welcome message="caka.app" />;
}
