import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { ResetPassword } from './pages/reset-password/reset-password';
import { AccommodationDetail } from './pages/accommodation-detail/accommodation-detail';
import { HostAccommodations } from './pages/host-accommodations/host-accommodations';
import { CreateAccommodation } from './pages/create-accommodation/create-accommodation';
import { EditAccommodation } from './pages/edit-accommodation/edit-accommodation';
import { Bookings } from './pages/bookings/bookings';
import { BookingDetail } from './pages/booking-detail/booking-detail';
import { Profile } from './pages/profile/profile';
import { CommentsAccommodation } from './pages/comments-accommodation/comments-accommodation';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    { path: 'forgot-password', component: ForgotPassword },
    { path: 'reset-password', component: ResetPassword },
    { path: 'accommodation/:id', component: AccommodationDetail },
    { path: 'host/accommodations', component: HostAccommodations },
    { path: 'host/accommodations/create', component: CreateAccommodation },
    { path: 'host/accommodations/edit', component: EditAccommodation },
    { path: 'bookings', component: Bookings },
    { path: 'booking/:id', component: BookingDetail },
    { path: 'profile', component: Profile },
    { path: 'comments/:AccommodationId', component: CommentsAccommodation },
    { path: "**", pathMatch: "full", redirectTo: "" }
];
