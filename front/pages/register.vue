<template>
  <div class="login card">
    <div class="card-header">
      <div class="card-title">
        Register
      </div>
    </div>
    <div class="card-body">
      <div class="login-form">
        <div>
          <div class="label">
            <div> E-mail </div>
            <div v-if="emailError" class="error"> {{ emailError }} </div>
          </div>
          <input
            v-model="email"
            class="input"
            :class="{'input-error': emailError}"
            type="mail"
            placeholder="Enter your E-mail."
            @focusout="checkEmail"
          >
        </div>
        <div class="mb-1">
          <div class="label">
            <div> Password </div>
            <div v-if="pwdError" class="error"> {{ pwdError }} </div>
          </div>
          <input
            v-model="password"
            class="input"
            :class="{'input-error': pwdError}"
            type="password"
            placeholder="Enter your password."
            @focusout="checkPassword"
          >
        </div>
        <div class="mb-1">
          <div class="label">
            <div> Confirm Password </div>
            <div v-if="pwdConfirmError" class="error"> {{ pwdConfirmError }} </div>
          </div>
          <input
            v-model="confirmedPassword"
            class="input"
            :class="{'input-error': pwdConfirmError}"
            type="password"
            placeholder="Re-enter your password."
            @focusout="checkConfirmedPassword"
          >
        </div>
        <div class="mb-1">
          <div v-if="registerError" class="error"> {{ registerError }} </div>
          <input class="btn btn-outline" type="button" value="Register" @click="submit">
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      email: '',
      password: '',
      confirmedPassword: '',
      emailError: undefined,
      pwdError: undefined,
      pwdConfirmError: undefined,
      registerError: undefined
    }
  },
  methods: {
    submit () {
      this.checkEmail()
      this.checkPassword()
      this.checkConfirmedPassword()

      if (!this.emailError && !this.pwdError && !this.pwdConfirmError) {
        this.$axios.$post('/api/teller/register', {
          email: this.email,
          password: this.password
        }).then(async (res) => {
          await this.$auth.loginWith('local', {
            data: {
              email: this.email,
              password: this.password
            }
          })
          this.$router.push('/wallet')
          this.registerError = undefined
        }).catch((err) => {
          console.log(err)
          this.registerError = err.response.data.error
        })
      }
    },
    checkEmail () {
      if (this.email.length > 30) {
        this.emailError = 'invalid email'
        return
      }
      /* eslint-disable */
      if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(this.email)) {
      /* eslint-enable */
        this.emailError = 'invalid email'
      } else {
        this.emailError = undefined
      }
    },
    checkPassword () {
      if (this.password.length < 10) {
        this.pwdError = 'short password'
      } else {
        this.pwdError = undefined
      }

      this.checkConfirmedPassword()
    },
    checkConfirmedPassword () {
      if (this.confirmedPassword.length === 0) {
        return
      }

      if (this.password !== this.confirmedPassword) {
        this.pwdConfirmError = 'password does not match'
      } else {
        this.pwdConfirmError = undefined
      }
    }
  }
}
</script>

<style scoped>
.login {
  max-width: 25em;
}

.login-form {
  display: flex;
  flex-direction: column;
}

.label {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.error {
  color: var(--clr-red);
}

.input-error {
  border-color: var(--clr-red) !important;
}

.input {
  transition: border-color var(--clr-trans-spd) var(--clr-trans-tf);
  border: 1px var(--clr-bg-dec) solid;
  border-radius: 7px;
  padding: .9em .7em;
  margin-top: .3em;
  width: 100%;
}

.btn {
  width: 100%
}

.submit {
  cursor: pointer;
}
</style>
