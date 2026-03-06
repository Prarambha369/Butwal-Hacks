import {
  Info,
  Layers,
  Zap,
  Rocket,
  Gamepad2,
  Users,
  Pen,
  Book,
  Mail,
  Shield,
  BookOpen,
  Calendar,
  HandHeart,
  Scale,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type NavItem = {
  href: string
  label: string
  icon?: LucideIcon
  children?: NavItem[]
  badge?: string
}

export const navConfig: NavItem[] = [
  {
    href: "/about",
    label: "About",
    icon: Info,
  },
  {
    href: "/initiatives",
    label: "Programs",
    icon: Layers,
    children: [
      {
        href: "/initiatives/hackathon",
        label: "Hackathon",
        icon: Zap,
      },
      {
        href: "/initiatives/mini-hackathon",
        label: "Mini Hackathon",
        icon: Rocket,
      },
      {
        href: "/initiatives/gamejam",
        label: "Game Jam",
        icon: Gamepad2,
      },
      {
        href: "/events",
        label: "Events",
        icon: Calendar,
      },
      {
        href: "/docs",
        label: "Learning Docs",
        icon: BookOpen,
      },
    ],
  },
  {
    href: "/community",
    label: "Community",
    icon: Users,
    children: [
      {
        href: "/community",
        label: "Community Hub",
        icon: Users,
      },
      {
        href: "/support",
        label: "Volunteer",
        icon: HandHeart,
      },
      {
        href: "/governance",
        label: "Governance",
        icon: Scale,
      },
      {
        href: "/contact",
        label: "Contact",
        icon: Mail,
      },
      {
        href: "/77-hacks",
        label: "77 Hacks",
      },
    ],
  },
  {
    href: "/governance",
    label: "Governance",
    icon: Scale,
  },
  {
    href: "/support",
    label: "Sponsorship",
    icon: HandHeart,
  },
  {
    href: "/blog",
    label: "Insights",
    icon: Pen,
  },
]

export const secondaryNavItems: NavItem[] = [
  {
    href: "/resources",
    label: "Resources",
    icon: Book,
  },
  {
    href: "/contact",
    label: "Contact",
    icon: Mail,
  },
]

export const legalNavItems: NavItem[] = [
  {
    href: "/privacy-policy",
    label: "Privacy Policy",
    icon: Shield,
  },
  {
    href: "/terms-of-service",
    label: "Terms of Service",
    icon: Shield,
  },
  {
    href: "/cookie-policy",
    label: "Cookie Policy",
    icon: Shield,
  },
]
