import { DashboardIcon, LeadsIcon, SearchIcon } from "@/components/ui/icons";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  descripcion: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Radar",
    icon: DashboardIcon,
    descripcion: "Resumen operativo y estado del radar",
  },
  {
    href: "/nueva-busqueda",
    label: "Nueva Búsqueda",
    icon: SearchIcon,
    descripcion: "Configurar parámetros y lanzar escaneo",
  },
  {
    href: "/leads",
    label: "Leads",
    icon: LeadsIcon,
    descripcion: "Explorador, filtros y exportación",
  },
];
