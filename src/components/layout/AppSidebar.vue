<template>
  <aside
    :class="[
      'fixed left-0 top-16 flex h-[calc(100dvh-4rem)] flex-col border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out z-99999 lg:top-0 lg:h-dvh dark:border-gray-800 dark:bg-gray-900',
      {
        'lg:w-[290px]': isExpanded || isMobileOpen || isHovered,
        'lg:w-[90px]': !isExpanded && !isHovered,
        'translate-x-0 w-[290px]': isMobileOpen,
        '-translate-x-full': !isMobileOpen,
        'lg:translate-x-0': true,
      },
    ]"
    @mouseenter="!isExpanded && (isHovered = true)"
    @mouseleave="isHovered = false"
  >
    <div
      :class="[
        'py-8 flex',
        !isExpanded && !isHovered ? 'lg:justify-center' : 'justify-start',
      ]"
    >
      <router-link to="/" class="flex items-center" @click="closeMobileSidebar">
        <span
          v-if="isExpanded || isHovered || isMobileOpen"
          class="text-xl font-bold text-gray-900 dark:text-white"
        >Qadam <span class="text-brand-400">LMS</span></span>
        <span
          v-else
          class="text-lg font-bold text-brand-400"
        >Q</span>
      </router-link>
    </div>
    <div
      class="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pb-4 duration-300 ease-linear no-scrollbar"
    >
      <nav class="mb-6">
        <div class="flex flex-col gap-4">
          <div v-for="(menuGroup, groupIndex) in menuGroups" :key="groupIndex">
            <h2
              :class="[
                'mb-4 text-xs uppercase flex leading-[20px] text-gray-400',
                !isExpanded && !isHovered
                  ? 'lg:justify-center'
                  : 'justify-start',
              ]"
            >
              <template v-if="isExpanded || isHovered || isMobileOpen">
                {{ menuGroup.title }}
              </template>
              <HorizontalDots v-else />
            </h2>
            <ul class="flex flex-col gap-4">
              <li v-for="(item, index) in menuGroup.items" :key="item.name">
                <button
                  v-if="item.subItems"
                  @click="toggleSubmenu(groupIndex, index)"
                  :class="[
                    'menu-item group w-full',
                    {
                      'menu-item-active': isSubmenuOpen(groupIndex, index),
                      'menu-item-inactive': !isSubmenuOpen(groupIndex, index),
                    },
                    !isExpanded && !isHovered
                      ? 'lg:justify-center'
                      : 'lg:justify-start',
                  ]"
                >
                  <span
                    :class="[
                      isSubmenuOpen(groupIndex, index)
                        ? 'menu-item-icon-active'
                        : 'menu-item-icon-inactive',
                    ]"
                  >
                    <component :is="item.icon" />
                  </span>
                  <span
                    v-if="isExpanded || isHovered || isMobileOpen"
                    class="menu-item-text"
                    >{{ item.name }}</span
                  >
                  <ChevronDownIcon
                    v-if="isExpanded || isHovered || isMobileOpen"
                    :class="[
                      'ml-auto w-5 h-5 transition-transform duration-200',
                      {
                        'rotate-180 text-brand-500': isSubmenuOpen(
                          groupIndex,
                          index
                        ),
                      },
                    ]"
                  />
                </button>
                <router-link
                  v-else-if="item.path"
                  @click="closeMobileSidebar"
                  :to="item.path"
                  :class="[
                    'menu-item group',
                    {
                      'menu-item-active': isActive(item.path),
                      'menu-item-inactive': !isActive(item.path),
                    },
                  ]"
                >
                  <span
                    :class="[
                      isActive(item.path)
                        ? 'menu-item-icon-active'
                        : 'menu-item-icon-inactive',
                    ]"
                  >
                    <component :is="item.icon" />
                  </span>
                  <span
                    v-if="isExpanded || isHovered || isMobileOpen"
                    class="menu-item-text"
                    >{{ item.name }}</span
                  >
                </router-link>
                <transition
                  @enter="startTransition"
                  @after-enter="endTransition"
                  @before-leave="startTransition"
                  @after-leave="endTransition"
                >
                  <div
                    v-show="
                      isSubmenuOpen(groupIndex, index) &&
                      (isExpanded || isHovered || isMobileOpen)
                    "
                  >
                    <ul class="mt-2 space-y-1 ml-9">
                      <li v-for="subItem in item.subItems" :key="subItem.name">
                        <router-link
                          :to="subItem.path"
                          @click="closeMobileSidebar"
                          :class="[
                            'menu-dropdown-item',
                            {
                              'menu-dropdown-item-active': isActive(
                                subItem.path
                              ),
                              'menu-dropdown-item-inactive': !isActive(
                                subItem.path
                              ),
                            },
                          ]"
                        >
                          {{ subItem.name }}
                          <span class="flex items-center gap-1 ml-auto">
                            <span
                              v-if="subItem.new"
                              :class="[
                                'menu-dropdown-badge',
                                {
                                  'menu-dropdown-badge-active': isActive(
                                    subItem.path
                                  ),
                                  'menu-dropdown-badge-inactive': !isActive(
                                    subItem.path
                                  ),
                                },
                              ]"
                            >
                              new
                            </span>
                            <span
                              v-if="subItem.pro"
                              :class="[
                                'menu-dropdown-badge',
                                {
                                  'menu-dropdown-badge-active': isActive(
                                    subItem.path
                                  ),
                                  'menu-dropdown-badge-inactive': !isActive(
                                    subItem.path
                                  ),
                                },
                              ]"
                            >
                              pro
                            </span>
                          </span>
                        </router-link>
                      </li>
                    </ul>
                  </div>
                </transition>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, watch, type Component } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  BookOpen,
  GraduationCap,
  Users,
  CalendarDays,
  School,
  ClipboardList,
  UserPlus,
  LayoutDashboard,
  Briefcase,
  Puzzle,
  ClipboardCheck,
  CalendarCog,
  CalendarClock,
  NotebookPen,
  SquareCheckBig,
} from "lucide-vue-next";

import {
  ChevronDownIcon,
  HorizontalDots,
} from "../../icons";
import { useSidebar } from "@/composables/useSidebar";
import { useAuth } from "@/composables/useAuth";
import type { UserRole } from "@/types/auth";

interface MenuSubItem {
  name: string;
  path: string;
  new?: boolean;
  pro?: boolean;
}

interface MenuItem {
  icon: Component;
  name: string;
  path?: string;
  subItems?: MenuSubItem[];
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const route = useRoute();
const { t } = useI18n();
const { user } = useAuth();

const { isExpanded, isMobileOpen, isHovered, openSubmenu, toggleMobileSidebar } = useSidebar();

const roles = computed(() => user.value?.roles);

const isStudent = computed(() => roles.value?.includes('student'));
const isParent = computed(() => roles.value?.includes('parent'));
const isClubManager = computed(() => roles.value?.includes('clubmanager'));
const isPsychologist = computed(() => roles.value?.includes('psychologist'));

const isAdmin = computed(() => (['admin', 'supervisor', 'principal'] as UserRole[]).some(role => roles.value?.includes(role)));
const isTeacher = computed(() => (['teacher', 'homeroom_teacher'] as UserRole[]).some(role => roles.value?.includes(role)));

const menuGroups = computed<MenuGroup[]>(() => {
  if (isStudent.value) {
    return [
      {
        title: t("nav.personal"),
        items: [
          {
            icon: BookOpen,
            name: t("nav.mySubjects"),
            path: "/my-subjects",
          },
          {
            icon: NotebookPen,
            name: t("nav.myHomeworks"),
            path: "/my-homeworks",
          },
          {
            icon: CalendarClock,
            name: t("nav.timetable"),
            path: "/timetable",
          },
          {
            icon: CalendarDays,
            name: t("nav.calendar"),
            path: "/lessons",
          },
          {
            icon: Users,
            name: t("nav.myTeachers"),
            path: "/my-teachers",
          },
          {
            icon: GraduationCap,
            name: t("nav.myClassmates"),
            path: "/my-classmates",
          },
        ],
      },
    ];
  }

  if (isParent.value) {
    return [
      {
        title: t("nav.personal"),
        items: [
          {
            icon: GraduationCap,
            name: t("nav.myChildren"),
            path: "/my-children",
          },
          {
            icon: CalendarClock,
            name: t("nav.timetable"),
            path: "/timetable",
          },
          {
            icon: CalendarDays,
            name: t("nav.calendar"),
            path: "/lessons",
          },
          {
            icon: Users,
            name: t("nav.myTeachers"),
            path: "/parent-teachers",
          },
        ],
      },
    ];
  }

  const menu: MenuGroup[] = [];
  const managementItems: MenuItem[] = [];
  const personalItems: MenuItem[] = [];

  if (isTeacher.value) {
    personalItems.push({
      icon: LayoutDashboard,
      name: t("nav.teacherDashboard"),
      path: "/teacher",
    },
    {
      icon: Briefcase,
      name: t("nav.workload"),
      path: "/teacher/workload",
    },
    // {
    //   icon: UserCircle,
    //   name: t("nav.myStudent"),
    //   path: "/my-student",
    // },
    {
      icon: ClipboardList,
      name: t("nav.myLessons"),
      path: "/my-lessons",
    });
  }

  if (roles.value?.includes('homeroom_teacher')) {
    personalItems.splice(-1, 0, {
      icon: School,
      name: t("nav.myClass"),
      path: "/my-class",
    });
  }

  if (isAdmin.value || isTeacher.value) {
    managementItems.push({
      icon: BookOpen,
      name: t("nav.subjects"),
      subItems: [
        { name: t("nav.subjectsActive"), path: "/subjects/active" },
        { name: t("nav.subjectsProcessing"), path: "/subjects/processing" },
        { name: t("nav.subjectsArchived"), path: "/subjects/archived" },
      ],
    },
    {
      icon: CalendarDays,
      name: t("nav.lessons"),
      subItems: [
        { name: t("nav.timetable"), path: "/timetable" },
        { name: t("nav.lessonCalendar"), path: "/lessons" },
      ],
    },
    ...(isTeacher.value
      ? [
          {
            icon: ClipboardCheck,
            name: t("nav.attendance"),
            path: "/attendance",
          },
          {
            icon: NotebookPen,
            name: t("nav.homeworks"),
            path: "/homeworks",
          },
          {
            icon: SquareCheckBig,
            name: t("nav.grading"),
            path: "/grading",
          },
        ]
      : []),
    ...(isAdmin.value
      ? [
          {
            icon: CalendarCog,
            name: t("nav.scheduleBuilder"),
            path: "/schedule-builder",
          },
        ]
      : []),
    {
      icon: Users,
      name: t("nav.teachers"),
      path: "/teachers",
    });
  }

  if (isAdmin.value || isPsychologist.value || isTeacher.value) {
    managementItems.push({
      icon: GraduationCap,
      name: t("nav.students"),
      path: "/students",
    });
  }

  if (isClubManager.value) {
    menu.push({
      title: t("nav.management"),
      items: [
        {
          icon: Puzzle,
          name: t("nav.clubs"),
          path: "/clubs",
        },
      ],
    });
  }

  if (isAdmin.value) {
    managementItems.push({
      icon: UserPlus,
      name: t("nav.register"),
      path: "/register",
    });
  }

  if (managementItems.length > 0) {
    menu.push({
      title: t("nav.management"),
      items: managementItems,
    });
  }
  if (personalItems.length > 0) {
    menu.push({
      title: t("nav.personal"),
      items: personalItems,
    });
  }
  return menu;
});

const isActive = (path?: string) =>
  route.path === path
  || (path === '/clubs' && route.path.startsWith('/clubs/'))
  || (path === '/homeworks' && route.path.startsWith('/homeworks/'));

const toggleSubmenu = (groupIndex: number, itemIndex: number) => {
  const key = `${groupIndex}-${itemIndex}`;
  openSubmenu.value = openSubmenu.value === key ? null : key;
};

const closeMobileSidebar = () => {
  if (isMobileOpen.value) toggleMobileSidebar();
};

watch(() => route.fullPath, closeMobileSidebar);

const isAnySubmenuRouteActive = computed(() => {
  return menuGroups.value.some((group) =>
    group.items.some(
      (item) =>
        item.subItems && item.subItems.some((subItem) => isActive(subItem.path))
    )
  );
});

const isSubmenuOpen = (groupIndex: number, itemIndex: number) => {
  const key = `${groupIndex}-${itemIndex}`;
  return (
    openSubmenu.value === key ||
    (isAnySubmenuRouteActive.value &&
      menuGroups.value[groupIndex].items[itemIndex].subItems?.some((subItem) =>
        isActive(subItem.path)
      ))
  );
};

const startTransition = (element: Element) => {
  const el = element as HTMLElement;
  el.style.height = "auto";
  const height = el.scrollHeight;
  el.style.height = "0px";
  el.offsetHeight; // force reflow
  el.style.height = height + "px";
};

const endTransition = (element: Element) => {
  (element as HTMLElement).style.height = "";
};
</script>
