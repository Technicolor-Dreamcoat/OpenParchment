export const RESULTS_PER_PAGE = 9;

export const DEFAULT_SEARCH_STATE = {
  label: "All Papers",
  sidebarLabel: "All Papers",
  query: "cat:cs.AI",
  icon: null,
};

export const CATEGORIES = [
  {
    label: "CS.AI",
    sidebarLabel: "Artificial Intelligence",
    query: "cat:cs.AI",
    icon: null,
  },
  {
    label: "CS.LG",
    sidebarLabel: "Deep Learning",
    query: "cat:cs.LG",
    icon: null,
  },
  {
    label: "Stat.ML",
    sidebarLabel: "Machine Learning",
    query: "cat:stat.ML",
    icon: null,
  },
  {
    label: "Physics",
    sidebarLabel: "Physics",
    query: "cat:physics.gen-ph",
    icon: null,
  },
];

export const SORT_OPTIONS = [
  {
    id: "relevance",
    label: "Relevance",
    sortBy: "relevance",
    sortOrder: "descending",
  },
  {
    id: "newest",
    label: "Newest",
    sortBy: "submittedDate",
    sortOrder: "descending",
  },
  {
    id: "oldest",
    label: "Oldest",
    sortBy: "submittedDate",
    sortOrder: "ascending",
  },
];
