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
  templateUrl: './club.component.html',
  styleUrl: './club.component.css',
})
export class ClubComponent {
  memberCount = 247;
  feed = CLUB_FEED;
}
