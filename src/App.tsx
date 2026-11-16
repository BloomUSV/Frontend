import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useResourceList } from './hooks/useResourceList';
import { getApiErrorMessage } from './services/apiError';
import { getResource } from './services/resourceService';
import type { AuthUser, Resource, ResourceType } from './types/resource';
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
  { page: 'waitlist', label: 'Lista de așteptare', icon: 'users' },
  { page: 'notifications', label: 'Notificări', icon: 'bell' },
  { page: 'rules', label: 'Reguli de utilizare', icon: 'book' },
  { page: 'feedback', label: 'Feedback', icon: 'message' },
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
  onBook: () => void;
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
          <b>3</b>
        </button>
        <button className="primary" onClick={onBook}>
          <Icon name="plus" /> Rezervare nouă
        </button>
      </div>
    </header>
  );
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
  onBook: () => void;
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
        <button className="outline full" onClick={onBook}>
          Verifică disponibilitatea <Icon name="arrow" />
        </button>
      </div>
    </article>
  );
}

function Dashboard({
  go,
  onBook,
  onSelectResource,
  role,
}: {
  go: (p: Page) => void;
  onBook: () => void;
  onSelectResource: (resourceId: string) => void;
  role: AuthUser['role'];
}) {
  const { resources, pagination, loading, error } = useResourceList({
    pageSize: 100,
  });
  const stats = [
    [
      'Resurse active',
      loading ? '…' : String(pagination.totalItems),
      'Disponibile în catalog',
      'box',
      'teal',
    ],
    ['Rezervări viitoare', '6', 'Următoarea: mâine', 'calendar', 'navy'],
    ['Cereri în așteptare', '3', 'Necesită aprobare', 'clock', 'amber'],
    ['Ore utilizate', '32h', 'În ultimele 30 zile', 'grid', 'purple'],
  ] as const;
  const visibleStats =
    role === 'user'
      ? stats.filter((stat) => stat[0] !== 'Cereri în așteptare')
      : stats;
  return (
    <>
      <Header
        title="Bună dimineața"
        subtitle="Iată ce se întâmplă cu resursele tale de cercetare la USV."
        onBook={onBook}
      />
      <main className="content">
        {error && <ApiAlert>{error}</ApiAlert>}
        <section className="stats">
          {visibleStats.map((stat) => (
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
        <section className="split">
          <div className="panel">
            <div className="panel-head">
              <div>
                <h2>Rezervări viitoare</h2>
                <p>Programul tău pentru următoarele zile</p>
              </div>
              <button className="text-button" onClick={() => go('bookings')}>
                Vezi toate <Icon name="arrow" />
              </button>
            </div>
            <div className="booking-list">
              <BookingLine
                date="18"
                month="IUN"
                title="Stație de lipit Weller WT 1010"
                info="Mâine, 10:00 – 12:00"
                location="Corp D, FabLab"
                type="confirmed"
              />
              <BookingLine
                date="20"
                month="IUN"
                title="Stație PC CAD/CAE Dell Precision"
                info="Vineri, 09:00 – 11:30"
                location="Corp D, Laborator D103"
                type="pending"
              />
              <BookingLine
                date="24"
                month="IUN"
                title="Banc electronic Keysight"
                info="Marți, 14:00 – 16:00"
                location="Corp D, Laborator D106"
                type="confirmed"
              />
            </div>
          </div>
          <div className="panel activity">
            <div className="panel-head">
              <div>
                <h2>Notificări recente</h2>
                <p>Actualizări importante</p>
              </div>
              <button
                className="text-button"
                onClick={() => go('notifications')}
              >
                Vezi toate
              </button>
            </div>
            <Notice
              icon="check"
              title="Rezervare confirmată"
              text="Rezervarea stației de lipit Weller a fost aprobată."
              time="Acum 18 min."
            />
            <Notice
              icon="clock"
              title="Cerere în curs de analiză"
              text="Cererea pentru stația PC CAD/CAE a fost trimisă managerului."
              time="Acum 2 ore"
            />
            <Notice
              icon="bell"
              title="Loc disponibil"
              text="Ai avansat pe poziția 1 în lista pentru Cluster HPC."
              time="Ieri, 16:42"
            />
          </div>
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

function BookingLine({
  date,
  month,
  title,
  info,
  location,
  type,
}: {
  date: string;
  month: string;
  title: string;
  info: string;
  location: string;
  type: string;
}) {
  return (
    <div className="booking-row">
      <div className="datebox">
        <strong>{date}</strong>
        <span>{month}</span>
      </div>
      <div className="booking-info">
        <strong>{title}</strong>
        <span>{info}</span>
        <small>
          <Icon name="pin" size={14} />
          {location}
        </small>
      </div>
      <Badge type={type}>
        {type === 'confirmed' ? 'Confirmată' : 'În așteptare'}
      </Badge>
      <button className="more">
        <Icon name="more" />
      </button>
    </div>
  );
}

function Notice({
  icon,
  title,
  text,
  time,
}: {
  icon: IconName;
  title: string;
  text: string;
  time: string;
}) {
  return (
    <div className="notice">
      <div className="notice-icon">
        <Icon name={icon} />
      </div>
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
        <small>{time}</small>
      </div>
    </div>
  );
}

function Catalog({
  onBook,
  onSelectResource,
}: {
  onBook: () => void;
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
  onBook: () => void;
}) {
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
                <button className="primary" onClick={onBook}>
                  <Icon name="calendar" /> Rezervă această resursă
                </button>
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

function CalendarPage({ onBook }: { onBook: () => void }) {
  const hours = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
  ];
  return (
    <>
      <Header
        title="Calendar disponibilitate"
        subtitle="Vezi programul și disponibilitatea tuturor resurselor."
        onBook={onBook}
      />
      <main className="content">
        <div className="calendar-tools">
          <div className="cal-nav">
            <button>‹</button>
            <button>Astăzi</button>
            <button>›</button>
            <strong>16 – 22 iunie 2025</strong>
          </div>
          <div className="view-toggle">
            <button>Zi</button>
            <button className="active">Săptămână</button>
            <button>Lună</button>
          </div>
        </div>
        <div className="calendar-panel">
          <div className="calendar-head">
            <div>GMT+3</div>
            {['LUN 16', 'MAR 17', 'MIE 18', 'JOI 19', 'VIN 20'].map((d, i) => (
              <div className={i === 2 ? 'active' : ''} key={d}>
                <span>{d.split(' ')[0]}</span>
                <strong>{d.split(' ')[1]}</strong>
              </div>
            ))}
          </div>
          <div className="calendar-body">
            <div className="hours">
              {hours.map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>
            <div className="day-col">
              <div className="event teal e1">
                <strong>Stație de lipit Weller</strong>
                <span>09:00–11:00</span>
              </div>
            </div>
            <div className="day-col">
              <div className="event navy e2">
                <strong>PC CAD/CAE Dell</strong>
                <span>10:00–13:00</span>
              </div>
            </div>
            <div className="day-col today">
              <div className="now" />
              <div className="event amber e3">
                <strong>Banc electronic Keysight</strong>
                <span>09:00–11:30</span>
              </div>
              <button className="open-slot" onClick={onBook}>
                + Interval liber
              </button>
            </div>
            <div className="day-col">
              <div className="event purple e4">
                <strong>Sala Atlas</strong>
                <span>13:00–15:00</span>
              </div>
            </div>
            <div className="day-col">
              <div className="event teal e5">
                <strong>Cluster HPC</strong>
                <span>11:00–16:00</span>
              </div>
            </div>
          </div>
        </div>
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
      <>
        <div className="panel wait-card">
          <div className="queue">1</div>
          <div>
            <Badge type="success">Prima poziție</Badge>
            <h2>Cluster HPC „Ștefan”</h2>
            <p>Interval dorit: 25–27 iunie · 16 noduri GPU</p>
          </div>
          <button className="outline">Modifică preferințele</button>
        </div>
        <div className="panel empty-small">
          <Icon name="bell" size={32} />
          <h2>Notificare instant activată</h2>
          <p>
            Vei primi o notificare în aplicație și prin e-mail când intervalul
            devine disponibil.
          </p>
        </div>
      </>
    ),
  },
  notifications: {
    title: 'Notificări',
    subtitle: 'Toate actualizările despre rezervările și resursele tale.',
    content: (
      <div className="panel">
        <div className="panel-head">
          <h2>Actualizări recente</h2>
          <button className="text-button">Marchează toate ca citite</button>
        </div>
        <Notice
          icon="check"
          title="Rezervare confirmată"
          text="Robot colaborativ UR10e · 18 iunie, 10:00–12:00"
          time="Acum 18 minute"
        />
        <Notice
          icon="clock"
          title="Cerere trimisă managerului"
          text="Microscop electronic SEM · 20 iunie, 09:00–11:30"
          time="Acum 2 ore"
        />
        <Notice
          icon="bell"
          title="Ai avansat în lista de așteptare"
          text="Acum ești pe poziția 1 pentru Cluster HPC „Ștefan”."
          time="Ieri, 16:42"
        />
      </div>
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
    content: (
      <>
        <section className="stats admin-stats">
          <div className="stat">
            <span>Utilizatori activi</span>
            <strong>284</strong>
            <small>18 manageri</small>
          </div>
          <div className="stat">
            <span>Aprobări</span>
            <strong>12</strong>
            <small>Necesită acțiune</small>
          </div>
        </section>
        <div className="panel">
          <div className="panel-head">
            <h2>Cereri recente</h2>
            <button className="primary">Gestionează aprobările</button>
          </div>
          {[
            'Elena Popescu — Microscop electronic SEM',
            'Victor Stan — Laborator Biotehnologii',
            'Ioana Mureșan — Cluster HPC „Ștefan”',
          ].map((x, i) => (
            <div className="admin-row" key={x}>
              <div className="avatar">{x[0]}</div>
              <strong>{x}</strong>
              <Badge type={i === 1 ? 'warning' : 'pending'}>În așteptare</Badge>
              <button className="outline">Analizează</button>
            </div>
          ))}
        </div>
      </>
    ),
  },
};

function Reservations({ onBook }: { onBook: () => void }) {
  const [cancel, setCancel] = useState(false);
  return (
    <>
      <Header
        title="Rezervările mele"
        subtitle="Administrează rezervările și urmărește starea cererilor."
        onBook={onBook}
      />
      <main className="content">
        <div className="filter-row">
          <button className="filter active">
            Toate <span>6</span>
          </button>
          <button className="filter">
            Confirmate <span>3</span>
          </button>
          <button className="filter">
            În așteptare <span>2</span>
          </button>
          <button className="filter">
            Respinse <span>1</span>
          </button>
        </div>
        <div className="panel reservation-table">
          <div className="table-head">
            <span>RESURSĂ</span>
            <span>DATA ȘI ORA</span>
            <span>ECHIPĂ</span>
            <span>STARE</span>
            <span>ACȚIUNI</span>
          </div>
          <BookingTable
            name="Stație de lipit Weller WT 1010"
            icon="lab"
            time="18 iun. · 10:00–12:00"
            team="Robotică Aplicată"
            status="Confirmată"
            onCancel={() => setCancel(true)}
          />
          <BookingTable
            name="Stație PC CAD/CAE Dell Precision"
            icon="cpu"
            time="20 iun. · 09:00–11:30"
            team="Proiectare Mecanică"
            status="În așteptare"
            onCancel={() => setCancel(true)}
          />
          <BookingTable
            name="Banc electronic Keysight"
            icon="box"
            time="24 iun. · 14:00–16:00"
            team="Electronică Aplicată"
            status="Confirmată"
            onCancel={() => setCancel(true)}
          />
        </div>
      </main>
      {cancel && <ConfirmModal close={() => setCancel(false)} />}
    </>
  );
}

function BookingTable({
  name,
  icon,
  time,
  team,
  status,
  onCancel,
}: {
  name: string;
  icon: IconName;
  time: string;
  team: string;
  status: string;
  onCancel: () => void;
}) {
  return (
    <div className="table-row">
      <span className="resource-cell">
        <i>
          <Icon name={icon} />
        </i>
        <strong>{name}</strong>
      </span>
      <span>{time}</span>
      <span>{team}</span>
      <span>
        <Badge type={status === 'Confirmată' ? 'confirmed' : 'pending'}>
          {status}
        </Badge>
      </span>
      <span className="actions">
        <button>Editare</button>
        <button onClick={onCancel}>Anulare</button>
      </span>
    </div>
  );
}

function Feedback({ onBook }: { onBook: () => void }) {
  const [sent, setSent] = useState(false);
  return (
    <>
      <Header
        title="Feedback"
        subtitle="Ajută-ne să îmbunătățim experiența platformei."
        onBook={onBook}
      />
      <main className="content">
        <div className="detail-columns">
          <form
            className="panel feedback"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
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
                  Subiect
                  <select>
                    <option>Experiența de rezervare</option>
                    <option>O resursă</option>
                    <option>Problemă tehnică</option>
                  </select>
                </label>
                <label>
                  Evaluare
                  <div className="rating">
                    {[1, 2, 3, 4, 5].map((x) => (
                      <button type="button" key={x}>
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
                  />
                </label>
                <button className="primary" type="submit">
                  Trimite feedback
                </button>
              </>
            )}
          </form>
          <div className="panel">
            <h2>Istoric feedback</h2>
            <div className="history">
              <Badge type="success">Rezolvat</Badge>
              <strong>Calendarul este foarte ușor de folosit</strong>
              <p>Trimis pe 2 iunie 2025</p>
            </div>
            <div className="history">
              <Badge type="pending">În analiză</Badge>
              <strong>Adăugare filtru după clădire</strong>
              <p>Trimis pe 28 mai 2025</p>
            </div>
          </div>
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
  onBook: () => void;
  role: AuthUser['role'];
}) {
  const p = simplePages[id];
  const isAdministrator = role === 'administrator';
  const title =
    id === 'admin' && !isAdministrator ? 'Gestionarea resurselor' : p.title;
  const subtitle =
    id === 'admin' && !isAdministrator
      ? 'Administrează resursele și disponibilitatea acestora.'
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
        {id !== 'admin' && p.content}
      </main>
    </>
  );
}

function BookingModal({ close }: { close: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [conflict, setConflict] = useState(false);
  const { resources, loading, error } = useResourceList({ pageSize: 100 });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (conflict) return;
    setSubmitted(true);
  };
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
                <select required disabled={loading || Boolean(error)}>
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
                  Data
                  <input type="date" defaultValue="2025-06-18" />
                </label>
                <label>
                  Echipă
                  <select>
                    <option>Echipa RoboLab</option>
                    <option>AI Research</option>
                  </select>
                </label>
                <label>
                  Ora de început
                  <input
                    type="time"
                    defaultValue="10:00"
                    onChange={(e) => setConflict(e.target.value === '11:00')}
                  />
                </label>
                <label>
                  Ora de sfârșit
                  <input type="time" defaultValue="12:00" />
                </label>
              </div>
              {conflict && (
                <div className="conflict">
                  <Icon name="bell" />
                  <span>
                    <strong>Interval indisponibil</strong>Există deja o
                    rezervare între 11:00 și 13:00. Alege alt interval.
                  </span>
                </div>
              )}
              <label>
                Scopul utilizării
                <textarea
                  rows={3}
                  defaultValue="Testarea algoritmului de control adaptiv pentru manipulare colaborativă."
                />
              </label>
              <div className="modal-actions">
                <button type="button" className="outline" onClick={close}>
                  Renunță
                </button>
                <button
                  className="primary"
                  disabled={
                    conflict ||
                    loading ||
                    Boolean(error) ||
                    resources.length === 0
                  }
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

function ConfirmModal({ close }: { close: () => void }) {
  return (
    <div className="modal-backdrop">
      <div className="modal confirm-modal">
        <div className="danger-icon">
          <Icon name="calendar" />
        </div>
        <h2>Anulezi rezervarea?</h2>
        <p>
          Intervalul va deveni disponibil pentru alte echipe. Această acțiune nu
          poate fi anulată.
        </p>
        <div className="modal-actions">
          <button className="outline" onClick={close}>
            Păstrează rezervarea
          </button>
          <button className="danger" onClick={close}>
            Da, anulează
          </button>
        </div>
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
              {n.page === 'notifications' && <b>3</b>}
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
            onBook={() => setBooking(true)}
            onSelectResource={handleSelectResource}
            role={user.role}
          />
        )}{' '}
        {currentPage === 'catalog' && (
          <Catalog
            onBook={() => setBooking(true)}
            onSelectResource={handleSelectResource}
          />
        )}{' '}
        {currentPage === 'detail' && (
          <Detail
            resourceId={selectedResourceId}
            go={setPage}
            onBook={() => setBooking(true)}
          />
        )}{' '}
        {currentPage === 'calendar' && (
          <CalendarPage onBook={() => setBooking(true)} />
        )}{' '}
        {currentPage === 'bookings' && (
          <Reservations onBook={() => setBooking(true)} />
        )}{' '}
        {currentPage === 'feedback' && (
          <Feedback onBook={() => setBooking(true)} />
        )}{' '}
        {(['waitlist', 'notifications', 'rules', 'admin'] as const).includes(
          currentPage as never,
        ) && (
          <SimplePage
            id={currentPage as keyof typeof simplePages}
            onBook={() => setBooking(true)}
            role={user.role}
          />
        )}
      </div>
      {booking && <BookingModal close={() => setBooking(false)} />}
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
