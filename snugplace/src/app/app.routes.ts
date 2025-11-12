import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { ChangeUserPassword } from './pages/change-user-password/change-user-password';
import { ResetPassword } from './pages/reset-password/reset-password';
import { AccommodationDetail } from './pages/accommodation-detail/accommodation-detail';
import { AccommodationDetailUser } from './pages/accommodation-detail-user/accommodation-detail-user';
import { HostAccommodations } from './pages/host-accommodations/host-accommodations';
import { CreateAccommodation } from './pages/create-accommodation/create-accommodation';
import { EditAccommodation } from './pages/edit-accommodation/edit-accommodation';
import { AccommodationMetric } from './pages/accommodation-metric/accommodation-metric';
import { Bookings } from './pages/bookings/bookings';
import { CreateBooking } from './pages/create-booking/create-booking';
import { BookingDetail } from './pages/booking-detail/booking-detail';
import { Profile } from './pages/profile/profile';
import { CommentsAccommodation} from './pages/comments-accommodation/comments-accommodation';
import { MyPlaces } from './pages/my-places/my-places';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    { path: ':id/profile/edit', component: Profile },
    { path: 'forgot-password', component: ForgotPassword },
    { path: ':id/profile/change-password', component: ChangeUserPassword },
    { path: 'reset-password', component: ResetPassword },
    { path: 'accommodation/:id', component: AccommodationDetail },
    { path: 'accommodation-detail/:id', component: AccommodationDetailUser },
    { path: 'host/accommodations', component: HostAccommodations },
    { path: 'host/accommodations/create', component: CreateAccommodation },
    { path: 'accommodation/edit/:id', component: EditAccommodation },
    { path: 'metrics/accommodations/:id', component: AccommodationMetric },
    { path: 'bookings', component: Bookings },
    { path: 'bookings/create/:accommodationId', component: CreateBooking},
    { path: 'booking/:id', component: BookingDetail },
    { path: 'comments/:AccommodationId', component: CommentsAccommodation },
    { path: "my-places", component: MyPlaces },
    { path: "**", pathMatch: "full", redirectTo: "" }
];
