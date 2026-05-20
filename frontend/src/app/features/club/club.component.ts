import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

const CLUB_FEED = [
  {
    id: 1, type: 'post',
    author: 'Sophie L.', initials: 'SL', bg: '#2563eb',
    time: 'il y a 1h',
    content: 'Super séance d\'entraînement ce matin ! Qui est partant pour une sortie dimanche ? 💪',
    likes: 18, comments: 4,
  },
  {
    id: 2, type: 'achievement',
    author: 'Thomas M.', initials: 'TM', bg: '#7c3aed',
    time: 'il y a 3h',
    achievement: '100km Club', icon: '🏆',
    description: 'A parcouru 100km ce mois-ci !',
    likes: 42, comments: 12,
  },
  {
    id: 3, type: 'post',
    author: 'Marie D.', initials: 'MD', bg: '#059669',
    time: 'il y a 5h',
    content: 'Nouveau parcours découvert ce matin — 15km avec 340m de dénivelé. Terrain technique mais magnifique ! 🌲',
    likes: 25, comments: 6,
  },
  {
    id: 4, type: 'achievement',
    author: 'Lucas B.', initials: 'LB', bg: '#d97706',
    time: 'il y a 8h',
    achievement: 'Série de 7 jours', icon: '🔥',
    description: 'A maintenu une série d\'entraînement de 7 jours !',
    likes: 33, comments: 8,
  },
];

@Component({
  selector: 'app-club',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="club-page">
      <!-- Club Header -->
      <div class="club-header">
        <div class="club-logo">🏃</div>
        <h2 class="club-name">SportXP Club</h2>
        <p class="club-desc">Communauté de sportifs passionnés</p>
        <div class="members-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span>{{ memberCount }} membres</span>
        </div>
      </div>

      <!-- Feed -->
      <div class="feed">
        @for (item of feed; track item.id) {
          <div class="feed-card">
            <div class="feed-header">
              <div class="feed-avatar" [style.background]="item.bg">{{ item.initials }}</div>
              <div class="feed-author-info">
                <div class="feed-author">{{ item.author }}</div>
                <div class="feed-time">{{ item.time }}</div>
              </div>
            </div>

            @if (item.type === 'post') {
              <p class="feed-content">{{ item.content }}</p>
            } @else {
              <div class="achievement-banner">
                <div class="achievement-trophy">{{ item.icon }}</div>
                <div class="achievement-text">
                  <div class="achievement-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                      <path d="M4 22h16"/>
                      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                    </svg>
                    Trophée débloqué !
                  </div>
                  <div class="achievement-name">{{ item.achievement }}</div>
                  <div class="achievement-desc">{{ item.description }}</div>
                </div>
              </div>
            }

            <div class="feed-footer">
              <button class="react-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span>{{ item.likes }}</span>
              </button>
              <button class="react-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span>{{ item.comments }}</span>
              </button>
            </div>
          </div>
        }
      </div>

      <div class="coming-soon">
        <p>Fonctionnalités sociales complètes bientôt disponibles 🚀</p>
      </div>
    </div>
  `,
  styles: [`
    .club-page {
      background: #f9fafb;
      min-height: 100%;
    }

    /* Header */
    .club-header {
      background: linear-gradient(135deg, #7c3aed, #4c1d95);
      padding: 2rem 1.5rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .club-logo {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: rgba(255,255,255,.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      margin-bottom: 10px;
      border: 3px solid rgba(255,255,255,.4);
    }

    .club-name {
      font-size: 1.4rem;
      font-weight: 700;
      color: white;
      margin: 0 0 4px;
    }

    .club-desc {
      color: #ddd6fe;
      font-size: 0.85rem;
      margin: 0 0 12px;
    }

    .members-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,.2);
      color: white;
      font-size: 0.85rem;
      font-weight: 500;
      padding: 6px 16px;
      border-radius: 999px;
    }

    /* Feed */
    .feed { }

    .feed-card {
      background: white;
      border-bottom: 1px solid #f3f4f6;
      padding: 14px 16px;
    }

    .feed-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }

    .feed-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 0.8rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .feed-author { font-size: 0.88rem; font-weight: 600; color: #111827; }
    .feed-time   { font-size: 0.75rem; color: #6b7280; margin-top: 1px; }

    .feed-content {
      font-size: 0.88rem;
      color: #374151;
      margin: 0 0 10px;
      line-height: 1.5;
    }

    /* Achievement banner */
    .achievement-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      background: linear-gradient(135deg, #fefce8, #fff7ed);
      border: 1.5px solid #fde68a;
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 10px;
    }

    .achievement-trophy {
      font-size: 2rem;
      flex-shrink: 0;
    }

    .achievement-label {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #d97706;
      margin-bottom: 2px;
    }

    .achievement-name {
      font-size: 1rem;
      font-weight: 700;
      color: #111827;
    }

    .achievement-desc {
      font-size: 0.8rem;
      color: #6b7280;
      margin-top: 2px;
    }

    /* Footer */
    .feed-footer {
      display: flex;
      gap: 8px;
      border-top: 1px solid #f3f4f6;
      padding-top: 10px;
    }

    .react-btn {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      border: none;
      background: none;
      color: #6b7280;
      font-size: 0.8rem;
      cursor: pointer;
      border-radius: 6px;
      font-family: inherit;
      transition: background 0.1s;
    }

    .react-btn:hover { background: #f3f4f6; }

    .coming-soon {
      padding: 1.5rem 1rem;
      text-align: center;
    }
    .coming-soon p { font-size: 0.82rem; color: #9ca3af; margin: 0; }
  `],
})
export class ClubComponent {
  memberCount = 247;
  feed = CLUB_FEED;
}
