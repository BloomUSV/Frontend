import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useResourceList } from './hooks/useResourceList';
import { getApiErrorMessage } from './services/apiError';
import { getResource } from './services/resourceService';
import {
  cancelReservation,
  createReservation,
  listReservations,
  reviewReservation,
  updateReservation,
} from './services/reservationService';
import {
  createWaitlistEntry,
  listWaitlist,
  removeWaitlistEntry,
} from './services/waitlistService';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from './services/notificationService';
import { createFeedback, listFeedback } from './services/feedbackService';
import {
  createRule,
  deleteRule,
  listRules,
  updateRule,
} from './services/ruleService';
import { listUsers, updateUser } from './services/userService';
import type { AuthUser, Resource, ResourceType } from './types/resource';
import Calendar from './components/Calendar';
import { setCalendarResources } from './components/Calendar';
import './components/ApiAlert.css';

const ResourceManagement = lazy(
  () => import('./components/ResourceManagement'),
);

type Page =
  | 'dashboard'
  | 'catalog'
  | 'detail'
  | 'calendar'
  | 'bookings'
  | 'waitlist'
  | 'notifications'
  | 'rules'
  | 'feedback'
  | 'admin'
  | 'login';
type IconName =
  | 'grid'
  | 'box'
  | 'calendar'
  | 'clock'
  | 'bell'
  | 'book'
  | 'message'
  | 'shield'
  | 'search'
  | 'plus'
  | 'chevron'
  | 'pin'
  | 'users'
  | 'cpu'
  | 'lab'
  | 'room'
  | 'robot'
  | 'check'
  | 'more'
  | 'arrow'
  | 'close'
  | 'logout';

const paths: Record<IconName, React.ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  box: (
    <>
      <path d="m21 8-9 5-9-5 9-5 9 5Z" />
      <path d="m3 8 9 5 9-5v9l-9 5-9-5V8Z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </>
  ),
  book: (
    <>
      <path d="M4 5a3 3 0 0 1 3-3h13v17H7a3 3 0 0 0-3 3V5Z" />
      <path d="M4 18a3 3 0 0 1 3-3h13" />
    </>
  ),
  message: (
    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
  ),
  shield: <path d="M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10Z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  pin: (
    <>
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </>
  ),
  cpu: (
    <>
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v4M15 1v4M9 19v4M15 19v4M19 9h4M19 14h4M1 9h4M1 14h4" />
    </>
  ),
  lab: (
    <>
      <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3" />
      <path d="M8 15h8" />
    </>
  ),
  room: (
    <>
      <path d="M3 21h18M5 21V4h14v17M9 8h2M9 12h2M9 16h2M15 8h1M15 12h1M15 16h1" />
    </>
  ),
  robot: (
    <>
      <rect x="4" y="7" width="16" height="13" rx="3" />
      <path d="M12 3v4M8 12h.01M16 12h.01M8 16h8" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  arrow: <path d="m5 12 14 0M13 6l6 6-6 6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  logout: (
    <>
      <path d="M10 17l5-5-5-5M15 12H3" />
      <path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
    </>
  ),
};

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

const nav: {
  page: Page;
  label: string;
  icon: IconName;
  roles?: AuthUser['role'][];
}[] = [
  { page: 'dashboard', label: 'Panou principal', icon: 'grid' },
  { page: 'catalog', label: 'Catalog resurse', icon: 'box' },
  { page: 'calendar', label: 'Calendar disponibilitate', icon: 'calendar' },
  { page: 'bookings', label: 'Rezervările mele', icon: 'clock' },
  {
    page: 'waitlist',
    label: 'Lista de așteptare',
    icon: 'users',
    roles: ['user'],
  },
  { page: 'notifications', label: 'Notificări', icon: 'bell' },
  { page: 'rules', label: 'Reguli de utilizare', icon: 'book' },
  {
    page: 'feedback',
    label: 'Feedback',
    icon: 'message',
    roles: ['user'],
  },
  {
    page: 'admin',
    label: 'Administrare',
    icon: 'shield',
    roles: ['manager', 'administrator'],
  },
];

function Badge({
  children,
  type = 'neutral',
}: {
  children: React.ReactNode;
  type?: string;
}) {
  return (
    <span className={`badge ${type}`}>
      <i />
      {children}
    </span>
  );
}

function ApiAlert({
  children,
  severity = 'error',
}: {
  children: React.ReactNode;
  severity?: 'error' | 'info';
}) {
  return (
    <div className={`api-alert ${severity}`} role="alert">
      {children}
    </div>
  );
}

function Header({
  title,
  subtitle,
  onBook,
}: {
  title: string;
  subtitle?: string;
  onBook?: () => void;
}) {
  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="header-actions">
        <button className="icon-button" aria-label="Notificări">
          <Icon name="bell" />
        </button>
        {onBook && (
          <button className="primary" onClick={onBook}>
            <Icon name="plus" /> Rezervare nouă
          </button>
        )}
      </div>
    </header>
  );
}

function getLocalDateTimeInputValue(value: Date) {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function getCurrentDateTimeMinimum() {
  const now = new Date();
  const roundedNow = new Date(now);
  roundedNow.setSeconds(0, 0);
  if (roundedNow < now) {
    roundedNow.setMinutes(roundedNow.getMinutes() + 1);
  }
  return getLocalDateTimeInputValue(roundedNow);
}

function getNextDateTimeInputValue(value: string) {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  date.setMinutes(date.getMinutes() + 1, 0, 0);
  return getLocalDateTimeInputValue(date);
}

const RESOURCE_PRESENTATION: Record<
  ResourceType,
  {
    category: string;
    icon: IconName;
    tone: string;
  }
> = {
  equipment: { category: 'Echipamente', icon: 'box', tone: 'cyan' },
  robot: { category: 'Robotică', icon: 'robot', tone: 'mint' },
  cluster: { category: 'Calcul performant', icon: 'cpu', tone: 'blue' },
  laboratory: { category: 'Laboratoare', icon: 'lab', tone: 'purple' },
  room: { category: 'Săli', icon: 'room', tone: 'rose' },
};

const RESOURCE_STATE_LABELS = {
  available: 'Disponibilă',
  unavailable: 'Indisponibilă',
  maintenance: 'În mentenanță',
};

function ResourceCard({
  item,
  onOpen,
  onBook,
}: {
  item: Resource;
  onOpen: () => void;
  onBook?: () => void;
}) {
  const presentation = RESOURCE_PRESENTATION[item.type];
  const status = RESOURCE_STATE_LABELS[item.state];

  return (
    <article className="resource-card">
      <button
        className={`resource-visual ${presentation.tone}`}
        onClick={onOpen}
        aria-label={`Deschide ${item.name}`}
      >
        <Icon name={presentation.icon} size={42} />
        <span>{presentation.category}</span>
      </button>
      <div className="resource-body">
        <div className="resource-title">
          <button onClick={onOpen}>{item.name}</button>
          <button className="more" aria-label={`Mai multe despre ${item.name}`}>
            <Icon name="more" />
          </button>
        </div>
        <p>{item.description}</p>
        <div className="meta">
          <span>
            <Icon name="pin" size={15} />
            {item.location}
          </span>
          <Badge type={item.state === 'available' ? 'success' : 'warning'}>
            {status}
          </Badge>
        </div>
        {onBook && (
          <button className="outline full" onClick={onBook}>
            Verifică disponibilitatea <Icon name="arrow" />
          </button>
        )}
      </div>
    </article>
  );
}

function Dashboard({
  go,
  onBook,
  onSelectResource,
}: {
  go: (p: Page) => void;
  onBook?: () => void;
  onSelectResource: (resourceId: string) => void;
}) {
  const { resources, pagination, loading, error } = useResourceList({
    pageSize: 100,
  });
  const availableResources = useResourceList({
    state: 'available',
    pageSize: 1,
  });
  const maintenanceResources = useResourceList({
    state: 'maintenance',
    pageSize: 1,
  });
  const unavailableResources = useResourceList({
    state: 'unavailable',
    pageSize: 1,
  });
  const stats = [
    [
      'Resurse active',
      loading ? '…' : String(pagination.totalItems),
      'Înregistrate în catalog',
      'box',
      'teal',
    ],
    [
      'Resurse disponibile',
      availableResources.loading
        ? '…'
        : String(availableResources.pagination.totalItems),
      'Pot fi rezervate',
      'check',
      'navy',
    ],
    [
      'În mentenanță',
      maintenanceResources.loading
        ? '…'
        : String(maintenanceResources.pagination.totalItems),
      'Temporar indisponibile',
      'clock',
      'amber',
    ],
    [
      'Indisponibile',
      unavailableResources.loading
        ? '…'
        : String(unavailableResources.pagination.totalItems),
      'Nu pot fi rezervate',
      'close',
      'purple',
    ],
  ] as const;
  const statsError =
    error ||
    availableResources.error ||
    maintenanceResources.error ||
    unavailableResources.error;
  return (
    <>
      <Header
        title="Bună dimineața"
        subtitle="Iată ce se întâmplă cu resursele tale de cercetare la USV."
        onBook={onBook}
      />
      <main className="content">
        {statsError && <ApiAlert>{statsError}</ApiAlert>}
        <section className="stats">
          {stats.map((stat) => (
            <div className="stat" key={stat[0]}>
              <div className={`stat-icon ${stat[4]}`}>
                <Icon name={stat[3]} />
              </div>
              <span>{stat[0]}</span>
              <strong>{stat[1]}</strong>
              <small>{stat[2]}</small>
            </div>
          ))}
        </section>
        <section>
          <div className="section-title">
            <div>
              <h2>Resurse din catalog</h2>
              <p>Resurse active înregistrate în platformă</p>
            </div>
            <button className="text-button" onClick={() => go('catalog')}>
              Explorează catalogul <Icon name="arrow" />
            </button>
          </div>
          {loading ? (
            <p role="status">Se încarcă resursele...</p>
          ) : resources.length === 0 ? (
            <p>Nu există resurse active momentan.</p>
          ) : (
            <div className="compact-grid">
              {resources.slice(0, 3).map((resource) => (
                <ResourceCard
                  key={resource.id}
                  item={resource}
                  onOpen={() => onSelectResource(resource.id)}
                  onBook={onBook}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function EmptyPanel({
  icon,
  title,
  children,
}: {
  icon: IconName;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel empty-small">
      <Icon name={icon} size={32} />
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}

function Catalog({
  onBook,
  onSelectResource,
}: {
  onBook?: () => void;
  onSelectResource: (resourceId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Toate');
  const [state, setState] = useState('');
  const [page, setPage] = useState(1);
  const categories = [
    { label: 'Toate', value: undefined },
    { label: 'Echipamente', value: 'equipment' as const },
    { label: 'Robotică', value: 'robot' as const },
    { label: 'Laboratoare', value: 'laboratory' as const },
    { label: 'Săli', value: 'room' as const },
    { label: 'Calcul performant', value: 'cluster' as const },
  ];
  const selectedType = categories.find(({ label }) => label === filter)?.value;
  const { resources, pagination, loading, error } = useResourceList({
    search: query.trim() || undefined,
    type: selectedType,
    state: state
      ? (state as 'available' | 'unavailable' | 'maintenance')
      : undefined,
    page,
    pageSize: 12,
  });

  function handleFilterChange(value: string) {
    setFilter(value);
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setQuery(value);
    setPage(1);
  }

  return (
    <>
      <Header
        title="Catalog resurse"
        subtitle="Descoperă și rezervă resursele disponibile în universitate."
        onBook={onBook}
      />
      <main className="content">
        <div className="catalog-toolbar">
          <label className="searchbox">
            <Icon name="search" />
            <input
              value={query}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Caută după nume, descriere sau locație..."
            />
          </label>
          <select
            aria-label="Stare resursă"
            value={state}
            onChange={(event) => {
              setState(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Orice stare</option>
            <option value="available">Disponibilă</option>
            <option value="unavailable">Indisponibilă</option>
            <option value="maintenance">În mentenanță</option>
          </select>
        </div>
        <div className="filter-row">
          {categories.map(({ label }) => (
            <button
              key={label}
              className={filter === label ? 'filter active' : 'filter'}
              onClick={() => handleFilterChange(label)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="results-head">
          <span>
            <strong>{pagination.totalItems}</strong> resurse găsite
          </span>
          <span>
            Pagina {pagination.page} din {Math.max(pagination.totalPages, 1)}
          </span>
        </div>
        {error && <ApiAlert>{error}</ApiAlert>}
        {loading ? (
          <p role="status">Se încarcă resursele...</p>
        ) : resources.length === 0 ? (
          <div className="panel resource-empty">
            <p>Nu am găsit resurse pentru criteriile selectate.</p>
          </div>
        ) : (
          <div className="resource-grid">
            {resources.map((resource) => (
              <ResourceCard
                key={resource.id}
                item={resource}
                onOpen={() => onSelectResource(resource.id)}
                onBook={onBook}
              />
            ))}
          </div>
        )}
        <div className="resource-pagination">
          <button
            className="outline"
            disabled={loading || page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Înapoi
          </button>
          <button
            className="outline"
            disabled={loading || page >= pagination.totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Înainte
          </button>
        </div>
      </main>
    </>
  );
}

function Detail({
  resourceId,
  go,
  onBook,
}: {
  resourceId: string | null;
  go: (page: Page) => void;
  onBook?: () => void;
}) {
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rules, setRules] = useState<import('./types/resource').ResourceRule[]>(
    [],
  );

  useEffect(() => {
    let active = true;

    if (!resourceId) {
      setError('Selectează o resursă din catalog.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    getResource(resourceId)
      .then((result) => {
        if (active) {
          setResource(result);
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            getApiErrorMessage(
              requestError,
              'Nu am putut încărca detaliile resursei.',
            ),
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [resourceId]);

  useEffect(() => {
    if (!resourceId) return;
    listRules(resourceId)
      .then(setRules)
      .catch(() => setRules([]));
  }, [resourceId]);

  return (
    <>
      <Header title="Detalii resursă" onBook={onBook} />
      <main className="content">
        <button className="back" onClick={() => go('catalog')}>
          ‹ Înapoi la catalog
        </button>
        {loading && <p role="status">Se încarcă detaliile resursei...</p>}
        {error && <ApiAlert>{error}</ApiAlert>}
        {resource && !loading && (
          <>
            <div className="detail-hero">
              <div className="detail-art">
                <Icon
                  name={RESOURCE_PRESENTATION[resource.type].icon}
                  size={84}
                />
              </div>
              <div className="detail-info">
                <Badge
                  type={resource.state === 'available' ? 'success' : 'warning'}
                >
                  {RESOURCE_STATE_LABELS[resource.state]}
                </Badge>
                <span className="eyebrow">
                  {RESOURCE_PRESENTATION[resource.type].category.toUpperCase()}
                </span>
                <h2>{resource.name}</h2>
                <p>
                  {resource.description || 'Nu a fost adăugată o descriere.'}
                </p>
                <div className="detail-meta">
                  <span>
                    <Icon name="pin" /> {resource.location}
                  </span>
                  {resource.managerId && (
                    <span>
                      <Icon name="users" /> ID manager: {resource.managerId}
                    </span>
                  )}
                </div>
                {onBook && (
                  <button className="primary" onClick={onBook}>
                    <Icon name="calendar" /> Rezervă această resursă
                  </button>
                )}
              </div>
            </div>
            <div className="detail-columns">
              <section className="panel">
                <h2>Specificații tehnice</h2>
                {Object.keys(resource.specifications).length === 0 ? (
                  <p>Nu au fost adăugate specificații.</p>
                ) : (
                  <div className="specs">
                    {Object.entries(resource.specifications).map(
                      ([label, value]) => (
                        <div key={label}>
                          <span>{label}</span>
                          <strong>
                            {typeof value === 'string'
                              ? value
                              : JSON.stringify(value)}
                          </strong>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </section>
              <section className="panel">
                <h2>Reguli pentru această resursă</h2>
                {rules.length === 0 ? (
                  <p>Nu există reguli suplimentare pentru această resursă.</p>
                ) : (
                  rules.map((rule) => (
                    <div key={rule.id}>
                      <strong>{rule.title}</strong>
                      <p>{rule.content}</p>
                    </div>
                  ))
                )}
              </section>
              <section className="panel availability">
                <div className="panel-head">
                  <div>
                    <h2>Stare</h2>
                    <p>{RESOURCE_STATE_LABELS[resource.state]}</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => go('calendar')}
                  >
                    Calendar complet
                  </button>
                </div>
                <button className="outline full" onClick={onBook}>
                  Selectează un interval
                </button>
              </section>
            </div>
          </>
        )}
      </main>
    </>
  );
}

const simplePages: Record<
  string,
  {
    title: string;
    subtitle: string;
    content: React.ReactNode;
  }
> = {
  waitlist: {
    title: 'Lista de așteptare',
    subtitle: 'Urmărește poziția ta și preferințele de notificare.',
    content: (
      <EmptyPanel icon="users" title="Nu există înregistrări">
        Poziția ta în lista de așteptare va apărea aici.
      </EmptyPanel>
    ),
  },
  notifications: {
    title: 'Notificări',
    subtitle: 'Toate actualizările despre rezervările și resursele tale.',
    content: (
      <EmptyPanel icon="bell" title="Nu există notificări">
        Actualizările despre rezervările și resursele tale vor apărea aici.
      </EmptyPanel>
    ),
  },
  rules: {
    title: 'Reguli de utilizare',
    subtitle: 'Politici pentru folosirea sigură și echitabilă a resurselor.',
    content: (
      <div className="panel rules">
        <h2>Reguli generale de rezervare</h2>
        <p>
          Rezervările trebuie făcute cu cel puțin 24 de ore înainte. Anulările
          sunt permise până la 12 ore înainte de începerea sesiunii.
        </p>
        <h2>Siguranță și acces</h2>
        <p>
          Accesul la echipamente specializate este permis numai utilizatorilor
          cu instruirea obligatorie finalizată și validă.
        </p>
        <h2>Utilizare echitabilă</h2>
        <p>
          În perioadele aglomerate, o echipă poate rezerva maximum 8 ore pe
          săptămână pentru aceeași resursă.
        </p>
      </div>
    ),
  },
  admin: {
    title: 'Administrare',
    subtitle: 'Gestionează utilizatorii, resursele și regulile platformei.',
    content: <UserAdministration />,
  },
};

function Reservations({
  onBook,
  role,
}: {
  onBook: () => void;
  role: AuthUser['role'];
}) {
  const [reservations, setReservations] = useState<
    import('./types/resource').Reservation[]
  >([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const minDateTime = getCurrentDateTimeMinimum();
  useEffect(() => {
    listReservations(role === 'user' ? 'own' : 'all')
      .then(setReservations)
      .catch((requestError) =>
        setError(
          getApiErrorMessage(requestError, 'Nu am putut încărca rezervările'),
        ),
      )
      .finally(() => setLoading(false));
  }, []);
  async function cancel(id: string) {
    try {
      await cancelReservation(id);
      setReservations((items) =>
        items.map((item) =>
          item.id === id ? { ...item, status: 'cancelled' } : item,
        ),
      );
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, 'Nu am putut anula rezervarea'),
      );
    }
  }
  function toLocalInput(value: string) {
    const date = new Date(value);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }
  return (
    <>
      <Header
        title="Rezervările mele"
        subtitle="Administrează rezervările și urmărește starea cererilor."
        onBook={onBook}
      />
      <main className="content">
        {loading && <p role="status">Se încarcă rezervările...</p>}
        {error && <ApiAlert>{error}</ApiAlert>}
        {!loading && reservations.length === 0 && (
          <EmptyPanel icon="calendar" title="Nu există rezervări">
            Rezervările tale vor apărea aici.
          </EmptyPanel>
        )}
        {reservations.map((reservation) => (
          <div className="panel" key={reservation.id}>
            <h2>{reservation.purpose || 'Rezervare resursă'}</h2>
            <p>
              {new Date(reservation.startsAt).toLocaleString('ro-RO')}
              {' – '}
              {new Date(reservation.endsAt).toLocaleString('ro-RO')}
            </p>
            <Badge type={reservation.status}>{reservation.status}</Badge>
            {role === 'user' &&
              ['pending', 'confirmed'].includes(reservation.status) &&
              editingId !== reservation.id && (
                <button
                  className="outline"
                  type="button"
                  onClick={() => {
                    setEditingId(reservation.id);
                    setEditStart(toLocalInput(reservation.startsAt));
                    setEditEnd(toLocalInput(reservation.endsAt));
                  }}
                >
                  Modifică
                </button>
              )}
            {editingId === reservation.id && (
              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  try {
                    const updated = await updateReservation(reservation.id, {
                      startsAt: new Date(editStart).toISOString(),
                      endsAt: new Date(editEnd).toISOString(),
                    });
                    setReservations((items) =>
                      items.map((item) =>
                        item.id === reservation.id ? updated : item,
                      ),
                    );
                    setEditingId(null);
                  } catch (requestError) {
                    setError(
                      getApiErrorMessage(
                        requestError,
                        'Rezervarea nu a putut fi modificată',
                      ),
                    );
                  }
                }}
              >
                <label>
                  Început
                  <input
                    required
                    type="datetime-local"
                    min={minDateTime}
                    value={editStart}
                    onChange={(event) => setEditStart(event.target.value)}
                  />
                </label>
                <label>
                  Sfârșit
                  <input
                    required
                    type="datetime-local"
                    min={getNextDateTimeInputValue(editStart) || minDateTime}
                    value={editEnd}
                    onChange={(event) => setEditEnd(event.target.value)}
                  />
                </label>
                <button className="primary" type="submit">
                  Salvează
                </button>
                <button
                  className="outline"
                  type="button"
                  onClick={() => setEditingId(null)}
                >
                  Renunță
                </button>
              </form>
            )}
            {role === 'user' &&
              ['pending', 'confirmed'].includes(reservation.status) && (
                <button
                  className="outline"
                  type="button"
                  onClick={() => cancel(reservation.id)}
                >
                  Anulează
                </button>
              )}
            {role === 'manager' &&
              ['pending', 'confirmed'].includes(reservation.status) && (
                <button
                  className="outline"
                  type="button"
                  onClick={() => cancel(reservation.id)}
                >
                  Anulează rezervarea
                </button>
              )}
            {role === 'manager' && reservation.status === 'pending' && (
              <>
                <button
                  className="primary"
                  type="button"
                  onClick={async () => {
                    await reviewReservation(reservation.id, 'confirmed');
                    setReservations((items) =>
                      items.map((item) =>
                        item.id === reservation.id
                          ? { ...item, status: 'confirmed' }
                          : item,
                      ),
                    );
                  }}
                >
                  Confirmă
                </button>
                <button
                  className="outline"
                  type="button"
                  onClick={async () => {
                    await reviewReservation(reservation.id, 'rejected');
                    setReservations((items) =>
                      items.map((item) =>
                        item.id === reservation.id
                          ? { ...item, status: 'rejected' }
                          : item,
                      ),
                    );
                  }}
                >
                  Respinge
                </button>
              </>
            )}
          </div>
        ))}
      </main>
    </>
  );
}

function Feedback({ onBook }: { onBook: () => void }) {
  const [sent, setSent] = useState(false);
  const [rating, setRating] = useState(0);
  const [resourceId, setResourceId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<import('./types/resource').Feedback[]>(
    [],
  );
  const { resources } = useResourceList({ pageSize: 100 });
  useEffect(() => {
    listFeedback()
      .then(setHistory)
      .catch((requestError) =>
        setError(
          getApiErrorMessage(requestError, 'Nu am putut încărca istoricul'),
        ),
      );
  }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await createFeedback({ resourceId, rating, message });
      setSent(true);
      setHistory(await listFeedback());
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, 'Feedback-ul nu a putut fi trimis'),
      );
    }
  };
  return (
    <>
      <Header
        title="Feedback"
        subtitle="Ajută-ne să îmbunătățim experiența platformei."
        onBook={onBook}
      />
      <main className="content">
        <div className="detail-columns">
          <form className="panel feedback" onSubmit={submit}>
            <h2>Trimite feedback</h2>
            {sent ? (
              <div className="success-box">
                <Icon name="check" />
                <strong>Mulțumim pentru feedback!</strong>
                <p>Mesajul tău a fost înregistrat.</p>
              </div>
            ) : (
              <>
                <label>
                  Resursă
                  <select
                    required
                    value={resourceId}
                    onChange={(event) => setResourceId(event.target.value)}
                  >
                    <option value="">Selectează o resursă</option>
                    {resources.map((resource) => (
                      <option key={resource.id} value={resource.id}>
                        {resource.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Evaluare
                  <div className="rating">
                    {[1, 2, 3, 4, 5].map((x) => (
                      <button
                        type="button"
                        key={x}
                        onClick={() => setRating(x)}
                        aria-label={`${x} stele`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </label>
                <label>
                  Mesaj
                  <textarea
                    placeholder="Spune-ne ce a funcționat bine sau ce putem îmbunătăți..."
                    rows={6}
                    required
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                  />
                </label>
                {error && <ApiAlert>{error}</ApiAlert>}
                <button className="primary" type="submit">
                  Trimite feedback
                </button>
              </>
            )}
          </form>
          <div className="panel">
            <h2>Istoric feedback</h2>
            {history.length === 0 ? (
              <p>Nu există feedback înregistrat.</p>
            ) : (
              history.map((item) => (
                <div key={item.id}>
                  <strong>{'★'.repeat(item.rating)}</strong>
                  <p>{item.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function WaitlistPage({
  onBook,
}: {
  onBook: (preset?: {
    resourceId: string;
    startsAt: string;
    endsAt: string;
  }) => void;
}) {
  const [entries, setEntries] = useState<
    import('./types/resource').WaitlistEntry[]
  >([]);
  const [resourceId, setResourceId] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState<string | null>(null);
  const minDateTime = getCurrentDateTimeMinimum();
  const { resources } = useResourceList({ pageSize: 100 });
  const refresh = () =>
    listWaitlist()
      .then(setEntries)
      .catch((requestError) =>
        setError(
          getApiErrorMessage(requestError, 'Lista nu poate fi încărcată'),
        ),
      );
  useEffect(() => {
    refresh();
  }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await createWaitlistEntry({
        resourceId,
        desiredStart: new Date(start).toISOString(),
        desiredEnd: new Date(end).toISOString(),
      });
      await refresh();
      setResourceId('');
      setStart('');
      setEnd('');
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          'Înregistrarea nu a putut fi adăugată',
        ),
      );
    }
  };
  return (
    <>
      <Header
        title="Lista de așteptare"
        subtitle="Înregistrează preferințele pentru intervale ocupate."
        onBook={onBook}
      />
      <main className="content">
        <div className="waitlist-explanation">
          <Icon name="users" size={22} />
          <div>
            <strong>Când se folosește lista de așteptare?</strong>
            <p>
              Alege resursa și intervalul dorit. Când intervalul se eliberează,
              vei primi o notificare în aplicație.
            </p>
          </div>
        </div>
        <div className="waitlist-layout">
          <form className="panel waitlist-form" onSubmit={submit}>
            <div className="panel-head">
              <div>
                <h2>Adaugă o preferință</h2>
                <p>Selectează exact intervalul dorit.</p>
              </div>
            </div>
            <label>
              Resursă
              <select
                required
                value={resourceId}
                onChange={(event) => setResourceId(event.target.value)}
              >
                <option value="">Selectează o resursă</option>
                {resources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="waitlist-time-grid">
              <label>
                Început
                <input
                  required
                  type="datetime-local"
                  min={minDateTime}
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                />
              </label>
              <label>
                Sfârșit
                <input
                  required
                  type="datetime-local"
                  min={getNextDateTimeInputValue(start) || minDateTime}
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                />
              </label>
            </div>
            {error && <ApiAlert>{error}</ApiAlert>}
            <button className="primary" type="submit">
              Alătură-te listei
            </button>
          </form>
          <section className="waitlist-list">
            <div className="section-title">
              <div>
                <h2>Preferințele tale</h2>
                <p>{entries.length} înregistrări active sau recente</p>
              </div>
            </div>
            {entries.length === 0 ? (
              <EmptyPanel icon="users" title="Nu ai preferințe în listă">
                Completează formularul pentru a fi notificat când apare loc.
              </EmptyPanel>
            ) : (
              entries.map((entry) => {
                const statusLabel =
                  entry.status === 'waiting'
                    ? 'Așteaptă disponibilitate'
                    : entry.status === 'notified'
                      ? 'Interval disponibil'
                      : entry.status === 'confirmed'
                        ? 'Rezervat'
                        : 'Retras';
                return (
                  <article className="waitlist-card" key={entry.id}>
                    <div className="waitlist-position">
                      {entry.position ? (
                        <>
                          <strong>{entry.position}</strong>
                          <span>în listă</span>
                        </>
                      ) : (
                        <Icon
                          name={
                            entry.status === 'confirmed'
                              ? 'check'
                              : entry.status === 'notified'
                                ? 'calendar'
                                : 'close'
                          }
                          size={22}
                        />
                      )}
                    </div>
                    <div className="waitlist-card-main">
                      <div className="waitlist-card-heading">
                        <div>
                          <span className="waitlist-resource">
                            {entry.resourceName || 'Resursă'}
                          </span>
                          <h3>{statusLabel}</h3>
                        </div>
                        <Badge
                          type={
                            entry.status === 'confirmed'
                              ? 'success'
                              : entry.status === 'notified'
                                ? 'warning'
                                : entry.status === 'waiting'
                                  ? 'pending'
                                  : 'neutral'
                          }
                        >
                          {statusLabel}
                        </Badge>
                      </div>
                      <div className="waitlist-time">
                        <Icon name="calendar" size={16} />
                        <span>
                          {new Date(entry.desiredStart).toLocaleString(
                            'ro-RO',
                            {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            },
                          )}
                          {' – '}
                          {new Date(entry.desiredEnd).toLocaleString('ro-RO', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                      {entry.status === 'waiting' && (
                        <p className="waitlist-description">
                          Poziția este calculată după ordinea înregistrării
                          pentru această resursă.
                        </p>
                      )}
                      {entry.status === 'notified' && (
                        <p className="waitlist-description available">
                          Intervalul este disponibil acum. Rezervarea trebuie
                          făcută în timp util.
                        </p>
                      )}
                    </div>
                    <div className="waitlist-actions">
                      {entry.status === 'notified' && (
                        <button
                          className="primary"
                          type="button"
                          onClick={() =>
                            onBook({
                              resourceId: entry.resourceId,
                              startsAt: entry.desiredStart,
                              endsAt: entry.desiredEnd,
                            })
                          }
                        >
                          Rezervă acum
                        </button>
                      )}
                      {['waiting', 'notified'].includes(entry.status) && (
                        <button
                          className="outline"
                          type="button"
                          onClick={async () => {
                            await removeWaitlistEntry(entry.id);
                            await refresh();
                          }}
                        >
                          Retrage
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </section>
        </div>
      </main>
    </>
  );
}

function UserAdministration() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const refresh = () =>
    listUsers()
      .then(setUsers)
      .catch((requestError) =>
        setError(
          getApiErrorMessage(requestError, 'Utilizatorii nu pot fi încărcați'),
        ),
      );
  useEffect(() => {
    refresh();
  }, []);
  return (
    <div className="panel">
      <h2>Utilizatori și roluri</h2>
      {error && <ApiAlert>{error}</ApiAlert>}
      {users.map((account) => (
        <div key={account.id}>
          <strong>{account.fullName}</strong>
          <p>{account.email}</p>
          <select
            value={account.role}
            onChange={async (event) => {
              await updateUser(account.id, {
                role: event.target.value as AuthUser['role'],
              });
              await refresh();
            }}
          >
            <option value="user">User</option>
            <option value="manager">Manager</option>
            <option value="administrator">Administrator</option>
          </select>
          <button
            className="outline"
            type="button"
            onClick={async () => {
              await updateUser(account.id, { isActive: !account.isActive });
              await refresh();
            }}
          >
            {account.isActive ? 'Dezactivează' : 'Activează'}
          </button>
        </div>
      ))}
    </div>
  );
}

function NotificationsPage({ onBook }: { onBook: () => void }) {
  const [items, setItems] = useState<import('./types/resource').Notification[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    listNotifications()
      .then(setItems)
      .catch((requestError) =>
        setError(
          getApiErrorMessage(requestError, 'Nu am putut încărca notificările'),
        ),
      );
  }, []);
  return (
    <>
      <Header
        title="Notificări"
        subtitle="Actualizări despre rezervări și disponibilitate."
        onBook={onBook}
      />
      <main className="content">
        {error && <ApiAlert>{error}</ApiAlert>}
        <button
          className="outline"
          type="button"
          onClick={async () => {
            await markAllNotificationsRead();
            setItems((values) =>
              values.map((item) => ({
                ...item,
                isRead: true,
              })),
            );
          }}
        >
          Marchează toate citite
        </button>
        {items.length === 0 ? (
          <EmptyPanel icon="bell" title="Nu există notificări">
            Actualizările vor apărea aici.
          </EmptyPanel>
        ) : (
          items.map((item) => (
            <div
              className={`notification-card ${item.isRead ? '' : 'unread'}`}
              key={item.id}
              onClick={async () => {
                await markNotificationRead(item.id);
                setItems((values) =>
                  values.map((value) =>
                    value.id === item.id ? { ...value, isRead: true } : value,
                  ),
                );
              }}
            >
              <div className="notification-icon">
                <Icon
                  name={
                    item.type === 'slot_available'
                      ? 'clock'
                      : item.type === 'resource_maintenance'
                        ? 'lab'
                        : item.type === 'booking_cancelled'
                          ? 'close'
                          : 'check'
                  }
                  size={18}
                />
              </div>
              <div className="notification-main">
                <strong>{item.message}</strong>
                <p>{new Date(item.createdAt).toLocaleString('ro-RO')}</p>
              </div>
              {!item.isRead && <span className="notification-dot" />}
            </div>
          ))
        )}
      </main>
    </>
  );
}

function RulesPage({
  onBook,
  role,
}: {
  onBook: () => void;
  role: AuthUser['role'];
}) {
  const [rules, setRules] = useState<import('./types/resource').ResourceRule[]>(
    [],
  );
  const [resourceId, setResourceId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [filterResourceId, setFilterResourceId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { resources } = useResourceList({ pageSize: 100 });
  const refresh = () =>
    listRules()
      .then(setRules)
      .catch((requestError) =>
        setError(
          getApiErrorMessage(requestError, 'Nu am putut încărca regulile'),
        ),
      );
  useEffect(() => {
    refresh();
  }, []);
  const visibleRules = filterResourceId
    ? rules.filter((rule) => rule.resourceId === filterResourceId)
    : rules;
  return (
    <>
      <Header
        title="Reguli de utilizare"
        subtitle="Politici pentru folosirea sigură și echitabilă."
        onBook={onBook}
      />
      <main className="content">
        {error && <ApiAlert>{error}</ApiAlert>}
        <div className="rules-toolbar">
          <div>
            <span className="rules-count">{rules.length}</span>
            <span> reguli definite</span>
          </div>
          <select
            aria-label="Filtrează regulile după resursă"
            value={filterResourceId}
            onChange={(event) => setFilterResourceId(event.target.value)}
          >
            <option value="">Toate resursele</option>
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.name}
              </option>
            ))}
          </select>
        </div>
        <div className="rules-layout">
          {role === 'administrator' && (
            <form
              className="panel rules-form"
              onSubmit={async (event) => {
                event.preventDefault();
                try {
                  await createRule({ resourceId, title, content });
                  await refresh();
                  setResourceId('');
                  setTitle('');
                  setContent('');
                } catch (requestError) {
                  setError(
                    getApiErrorMessage(
                      requestError,
                      'Regula nu a putut fi adăugată',
                    ),
                  );
                }
              }}
            >
              <div className="panel-head">
                <div>
                  <h2>Adaugă regulă</h2>
                  <p>Aplică o instrucțiune unei resurse.</p>
                </div>
              </div>
              <label>
                Resursă
                <select
                  required
                  value={resourceId}
                  onChange={(event) => setResourceId(event.target.value)}
                >
                  <option value="">Selectează o resursă</option>
                  {resources.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Titlu
                <input
                  required
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>
              <label>
                Conținut
                <textarea
                  required
                  rows={5}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                />
              </label>
              <button className="primary" type="submit">
                Publică regula
              </button>
            </form>
          )}
          <section className="rules-list">
            {visibleRules.length === 0 ? (
              <EmptyPanel icon="book" title="Nu există reguli">
                Selectează o altă resursă sau adaugă prima regulă.
              </EmptyPanel>
            ) : (
              visibleRules.map((rule) => (
                <article className="rule-card" key={rule.id}>
                  <div className="rule-card-accent" />
                  <div className="rule-card-main">
                    <span className="rule-resource">
                      {rule.resourceName || 'Regulă generală'}
                    </span>
                    {editingId === rule.id ? (
                      <div className="rule-edit">
                        <input
                          aria-label="Titlul regulii"
                          value={editTitle}
                          onChange={(event) => setEditTitle(event.target.value)}
                        />
                        <textarea
                          aria-label="Conținutul regulii"
                          rows={4}
                          value={editContent}
                          onChange={(event) =>
                            setEditContent(event.target.value)
                          }
                        />
                        <div className="rule-actions">
                          <button
                            className="primary"
                            type="button"
                            onClick={async () => {
                              await updateRule(rule.id, {
                                title: editTitle,
                                content: editContent,
                              });
                              await refresh();
                              setEditingId(null);
                            }}
                          >
                            Salvează
                          </button>
                          <button
                            className="outline"
                            type="button"
                            onClick={() => setEditingId(null)}
                          >
                            Renunță
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2>{rule.title}</h2>
                        <p>{rule.content}</p>
                      </>
                    )}
                  </div>
                  {role === 'administrator' && editingId !== rule.id && (
                    <div className="rule-actions">
                      <button
                        className="outline"
                        type="button"
                        onClick={() => {
                          setEditingId(rule.id);
                          setEditTitle(rule.title);
                          setEditContent(rule.content);
                        }}
                      >
                        Editează
                      </button>
                      <button
                        className="danger"
                        type="button"
                        onClick={async () => {
                          await deleteRule(rule.id);
                          await refresh();
                        }}
                      >
                        Șterge
                      </button>
                    </div>
                  )}
                </article>
              ))
            )}
          </section>
        </div>
      </main>
    </>
  );
}

function SimplePage({
  id,
  onBook,
  role,
}: {
  id: keyof typeof simplePages;
  onBook?: () => void;
  role: AuthUser['role'];
}) {
  const p = simplePages[id];
  const isAdministrator = role === 'administrator';
  const title =
    id === 'admin' && !isAdministrator ? 'Gestionarea resurselor' : p.title;
  const subtitle =
    id === 'admin' && !isAdministrator
      ? 'Administrează resursele și disponibilitatea acestora.'
      : id === 'admin'
        ? 'Gestionează resursele, utilizatorii și regulile platformei.'
        : p.subtitle;
  return (
    <>
      <Header title={title} subtitle={subtitle} onBook={onBook} />
      <main className="content simple-content">
        {id === 'admin' && (
          <>
            {isAdministrator && p.content}
            <Suspense
              fallback={
                <p role="status">Se încarcă administrarea resurselor...</p>
              }
            >
              <ResourceManagement />
            </Suspense>
          </>
        )}
        {id !== 'admin' &&
          id !== 'waitlist' &&
          id !== 'notifications' &&
          id !== 'rules' &&
          p.content}
      </main>
    </>
  );
}

function BookingModal({
  close,
  preset,
}: {
  close: () => void;
  preset: {
    resourceId: string;
    startsAt: string;
    endsAt: string;
  } | null;
}) {
  const minDateTime = getCurrentDateTimeMinimum();
  function toLocalInput(value: string) {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }
  const [submitted, setSubmitted] = useState(false);
  const { resources, loading, error } = useResourceList({ pageSize: 100 });
  const [resourceId, setResourceId] = useState(preset?.resourceId ?? '');
  const [startsAt, setStartsAt] = useState(
    preset ? toLocalInput(preset.startsAt) : '',
  );
  const [endsAt, setEndsAt] = useState(
    preset ? toLocalInput(preset.endsAt) : '',
  );
  const [purpose, setPurpose] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    try {
      await createReservation({
        resourceId,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        purpose,
      });
      setSubmitted(true);
    } catch (requestError) {
      setSubmitError(
        getApiErrorMessage(requestError, 'Rezervarea nu a putut fi creată'),
      );
    }
  };
  useEffect(() => {
    if (preset) {
      setResourceId(preset.resourceId);
      setStartsAt(toLocalInput(preset.startsAt));
      setEndsAt(toLocalInput(preset.endsAt));
    }
  }, [preset]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div className="modal">
        <button className="modal-close" onClick={close}>
          <Icon name="close" />
        </button>
        {submitted ? (
          <div className="modal-success">
            <div>
              <Icon name="check" size={32} />
            </div>
            <h2>Cerere trimisă</h2>
            <p>
              Rezervarea a fost înregistrată și așteaptă aprobarea managerului.
              Te vom notifica imediat.
            </p>
            <button className="primary full" onClick={close}>
              Vezi rezervările mele
            </button>
          </div>
        ) : (
          <>
            <span className="eyebrow">REZERVARE NOUĂ</span>
            <h2>Rezervă o resursă</h2>
            <p>Completează detaliile sesiunii de cercetare.</p>
            <form onSubmit={submit}>
              <label>
                Resursă
                <select
                  required
                  disabled={loading || Boolean(error)}
                  value={resourceId}
                  onChange={(e) => setResourceId(e.target.value)}
                >
                  <option value="">Selectează o resursă</option>
                  {resources.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name}
                    </option>
                  ))}
                </select>
              </label>
              {loading && <p role="status">Se încarcă resursele...</p>}
              {error && <ApiAlert>{error}</ApiAlert>}
              {!loading && resources.length === 0 && (
                <ApiAlert severity="info">
                  Nu există resurse active pentru rezervare.
                </ApiAlert>
              )}
              <div className="form-grid">
                <label>
                  Început
                  <input
                    type="datetime-local"
                    required
                    min={minDateTime}
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                  />
                </label>
                <label>
                  Sfârșit
                  <input
                    type="datetime-local"
                    required
                    min={getNextDateTimeInputValue(startsAt) || minDateTime}
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                  />
                </label>
              </div>
              <label>
                Scopul utilizării
                <textarea
                  rows={3}
                  placeholder="Descrie scopul sesiunii de cercetare..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </label>
              {submitError && <ApiAlert>{submitError}</ApiAlert>}
              <div className="modal-actions">
                <button type="button" className="outline" onClick={close}>
                  Renunță
                </button>
                <button
                  className="primary"
                  disabled={loading || Boolean(error) || resources.length === 0}
                >
                  Trimite cererea
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function Login({
  onLogin,
  initialError,
}: {
  onLogin: (email: string, password: string) => Promise<void>;
  initialError: string | null;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(initialError);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onLogin(email, password);
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(
          requestError,
          'Autentificarea nu a reușit. Încearcă din nou.',
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login">
      <div className="login-brand">
        <div className="login-logo">
          <Logo />
          <div>
            <span>UNIVERSITATEA „ȘTEFAN CEL MARE”</span>
            <strong>Research Resource Manager</strong>
          </div>
        </div>
        <div className="login-copy">
          <small>PLATFORMĂ PENTRU CERCETARE</small>
          <h1>
            Resurse comune.
            <br />
            Cercetare fără limite.
          </h1>
          <p>
            Rezervă echipamente, laboratoare și infrastructură de calcul din
            campusul USV, într-un singur loc.
          </p>
          <div className="campus-note">
            <Icon name="pin" />
            <span>Campus USV · Strada Universității 13, Suceava</span>
          </div>
        </div>
      </div>
      <form className="login-card" onSubmit={handleSubmit}>
        <h2>Bine ai revenit</h2>
        <p>Autentifică-te folosind contul instituțional USV.</p>
        {error && <ApiAlert>{error}</ApiAlert>}
        <label>
          Adresă de e-mail
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Parolă
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <div className="login-options">
          <span>Conturile manager și administrator pot gestiona resurse.</span>
        </div>
        <button className="primary full" disabled={submitting}>
          {submitting ? 'Se autentifică...' : 'Autentificare'}
        </button>
        <small>Acces securizat pentru comunitatea academică USV.</small>
      </form>
    </div>
  );
}

function Logo() {
  return (
    <div className="logo" aria-label="Sigla Research Resource Manager">
      <svg viewBox="0 0 48 48" role="img">
        <path
          d="M24 3 43 12v13c0 10-7.7 17-19 20C12.7 42 5 35 5 25V12L24 3Z"
          fill="currentColor"
        />
        <path
          d="M15 17h14.5a6.5 6.5 0 0 1 0 13H27l6 8h-7l-6-9v9h-5V17Zm5 5v4h9.2a2 2 0 0 0 0-4H20Z"
          fill="white"
        />
        <path
          d="M8 13 24 6l16 7"
          fill="none"
          stroke="white"
          strokeWidth="1.4"
          opacity=".65"
        />
      </svg>
    </div>
  );
}

function Application() {
  const { user, isLoading, error, login, logout } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const [booking, setBooking] = useState(false);
  const [bookingPreset, setBookingPreset] = useState<{
    resourceId: string;
    startsAt: string;
    endsAt: string;
  } | null>(null);
  const { resources: calendarResources } = useResourceList({ pageSize: 100 });
  useEffect(() => {
    setCalendarResources(calendarResources);
  }, [calendarResources]);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(
    null,
  );
  const currentPage =
    page === 'admin' && !['manager', 'administrator'].includes(user?.role ?? '')
      ? 'dashboard'
      : page;
  const title = useMemo(() => {
    if (currentPage === 'admin' && user?.role === 'manager') {
      return 'Gestionarea resurselor';
    }

    return nav.find((item) => item.page === currentPage)?.label || 'Resurse';
  }, [currentPage, user?.role]);
  if (isLoading) {
    return (
      <div className="auth-loading" role="status">
        Se verifică sesiunea...
      </div>
    );
  }
  if (!user) {
    return (
      <Login
        onLogin={async (email, password) => {
          await login(email, password);
          setPage('dashboard');
        }}
        initialError={error}
      />
    );
  }

  const visibleNav = nav
    .filter((item) => !item.roles || item.roles.includes(user.role))
    .map((item) =>
      item.page === 'admin' && user.role === 'manager'
        ? { ...item, label: 'Gestionarea resurselor' }
        : item,
    );
  const handleSelectResource = (resourceId: string) => {
    setSelectedResourceId(resourceId);
    setPage('detail');
  };
  const handleLogout = () => {
    logout();
    setPage('dashboard');
  };
  const openBooking: (() => void) | undefined =
    user.role === 'user'
      ? () => {
          setBookingPreset(null);
          setBooking(true);
        }
      : undefined;

  return (
    <div className="app-shell">
      <aside>
        <div className="brand">
          <Logo />
          <div>
            <strong>Research Resource</strong>
            <span>Manager · USV</span>
          </div>
        </div>
        <div className="workspace">
          <span>SPAȚIU DE LUCRU</span>
          <strong>Universitatea „Ștefan cel Mare”</strong>
          <small>Cercetare & Inovare · Suceava</small>
        </div>
        <nav aria-label="Navigare principală">
          {visibleNav.map((n) => (
            <button
              key={n.page}
              className={currentPage === n.page ? 'active' : ''}
              onClick={() => setPage(n.page)}
            >
              <Icon name={n.icon} />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="user">
          <div className="avatar">
            {user.fullName
              .split(' ')
              .map((part) => part[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
          <div>
            <strong>{user.fullName}</strong>
            <span>
              {user.role === 'administrator'
                ? 'Administrator'
                : user.role === 'manager'
                  ? 'Manager'
                  : 'Cercetător'}
            </span>
          </div>
          <button onClick={handleLogout} title="Deconectare">
            <Icon name="logout" />
          </button>
        </div>
      </aside>
      <div className="main-view" aria-label={title}>
        {currentPage === 'dashboard' && (
          <Dashboard
            go={setPage}
            onBook={openBooking}
            onSelectResource={handleSelectResource}
          />
        )}{' '}
        {currentPage === 'catalog' && (
          <Catalog
            onBook={openBooking}
            onSelectResource={handleSelectResource}
          />
        )}{' '}
        {currentPage === 'detail' && (
          <Detail
            resourceId={selectedResourceId}
            go={setPage}
            onBook={openBooking}
          />
        )}{' '}
        {currentPage === 'calendar' && (
          <Calendar
            onBook={(preset) => {
              if (user.role === 'user') {
                setBookingPreset(preset ?? null);
                setBooking(true);
              }
            }}
            onSelectResource={handleSelectResource}
            userRole={user.role}
          />
        )}{' '}
        {currentPage === 'bookings' && (
          <Reservations onBook={openBooking} role={user.role} />
        )}{' '}
        {currentPage === 'feedback' && <Feedback onBook={openBooking} />}{' '}
        {currentPage === 'waitlist' && (
          <WaitlistPage
            onBook={(preset) => {
              setBookingPreset(preset ?? null);
              if (user.role === 'user') setBooking(true);
            }}
          />
        )}
        {currentPage === 'notifications' && (
          <NotificationsPage onBook={openBooking} />
        )}
        {currentPage === 'rules' && (
          <RulesPage onBook={openBooking} role={user.role} />
        )}
        {(['admin'] as const).includes(currentPage as never) && (
          <SimplePage
            id={currentPage as keyof typeof simplePages}
            onBook={openBooking}
            role={user.role}
          />
        )}
      </div>
      {booking && (
        <BookingModal close={() => setBooking(false)} preset={bookingPreset} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Application />
    </AuthProvider>
  );
}
